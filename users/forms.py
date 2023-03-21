from allauth.socialaccount.forms import SignupForm
from django import forms
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Metadata
from users.models import Vcode
from utility.message import send_msg
from utility.d_utils import validation


checkbox_input_class = "h-4 w-4 text-flamingo-600 rounded border-gray-300"
checkbox_input_focus_state_class = (
    "focus:ring-offset-flamingo-50 focus:ring-flamingo-500"
)
checkbox_input_disabled_state_class = "disabled:opacity-75 disabled:cursor-not-allowed"
text_input_class = (
    "block w-full sm:text-sm placeholder-gray-400 rounded-md border-gray-300"
)
text_input_focus_state_class = "focus:ring-flamingo-500 focus:border-flamingo-500"
text_input_read_only_state_class = "read-only:bg-gray-100 read-only:cursor-not-allowed"
text_input_disabled_state_class = "disabled:bg-gray-100 disabled:cursor-not-allowed"
step_one_class = "step-one"
step_two_class = "step-two"
only_hangul_class = "only-hangul"
only_number_class = "only-number"
only_email_class = "only-email"
only_phone_class = "only-phone"


class SocialSignupForm(SignupForm):
    first_name = forms.CharField(
        max_length=1000, widget=forms.TextInput(attrs={"type": "hidden"})
    )
    last_name = forms.CharField(
        max_length=1000, widget=forms.TextInput(attrs={"type": "hidden"})
    )
    agree = forms.BooleanField(
        label="개인정보 수집 및 이용에 동의합니다.",
        widget=forms.CheckboxInput(
            attrs={
                "class": f"{checkbox_input_class} {step_one_class} {checkbox_input_focus_state_class} {checkbox_input_disabled_state_class}",
                "required": "",
            }
        ),
    )
    student_id = forms.CharField(
        max_length=10,
        min_length=10,
        label="학번",
        widget=forms.TextInput(
            attrs={
                "type": "text",
                "class": f"{text_input_class} {step_one_class} {only_number_class} {text_input_focus_state_class} {text_input_read_only_state_class}",
                "placeholder": f"{timezone.now().year}113000",
                "required": "",
            }
        ),
    )
    name = forms.CharField(
        max_length=15,
        min_length=2,
        label="성명",
        widget=forms.TextInput(
            attrs={
                "type": "text",
                "class": f"{text_input_class} {step_one_class} {only_hangul_class} {text_input_focus_state_class} {text_input_read_only_state_class}",
                "placeholder": "홍길동",
                "required": "",
            }
        ),
    )
    email = forms.CharField(
        max_length=100,
        label="이메일 주소",
        widget=forms.TextInput(
            attrs={
                "type": "text",
                "class": f"{text_input_class} {step_one_class} {only_email_class} {text_input_focus_state_class} {text_input_read_only_state_class}",
                "placeholder": "gildong@example.com",
                "required": "",
            }
        ),
    )
    phone = forms.CharField(
        max_length=13,
        min_length=13,
        label="휴대전화 번호",
        widget=forms.TextInput(
            attrs={
                "type": "tel",
                "class": f"{text_input_class} {step_one_class} {only_phone_class} {text_input_focus_state_class} {text_input_read_only_state_class}",
                "placeholder": "010-0000-0000",
                "required": "",
            }
        ),
    )
    email_vcode = forms.CharField(
        max_length=6,
        min_length=6,
        label="이메일 주소 인증번호",
        widget=forms.TextInput(
            attrs={
                "type": "text",
                "class": f"{text_input_class} {step_two_class} {only_number_class} {text_input_focus_state_class} {text_input_read_only_state_class} {text_input_disabled_state_class}",
                "placeholder": "000000",
                "required": "",
                "disabled": "",
            }
        ),
    )
    phone_vcode = forms.CharField(
        max_length=6,
        min_length=6,
        label="휴대전화 번호 인증번호",
        widget=forms.TextInput(
            attrs={
                "type": "text",
                "class": f"{text_input_class} {step_two_class} {only_number_class} {text_input_focus_state_class} {text_input_read_only_state_class} {text_input_disabled_state_class}",
                "placeholder": "000000",
                "required": "",
                "disabled": "",
            }
        ),
    )

    def pre_save(self, request):
        if request.method == "POST":
            agree = self.cleaned_data["agree"]
            student_id = self.cleaned_data["student_id"]
            name = self.cleaned_data["name"]
            email = self.cleaned_data["email"]
            phone = self.cleaned_data["phone"]
            raw_data = {
                "agree": agree,
                "student_id": student_id,
                "name": name,
                "email": email,
                "phone": phone,
            }
            user_registered_with_this_student_id = User.objects.filter(username=student_id)
            confirmed_vcode = Vcode.objects.filter(student_id=student_id, confirmed=True)
            if user_registered_with_this_student_id.count() > 0:
                send_msg(request, "duplicate signup attempted")
                return None
            elif confirmed_vcode.count() == 0:
                send_msg(request, "verification process bypassed")
                return None
            elif validation(raw_data, "sign up") == False:
                send_msg(request, "server-side validation failed")
                return None
            else:
                confirmed_vcode.delete()
        else:
            send_msg(request, "unexpected request")
        return self.save(request, raw_data)

    def save(self, request, raw_data):
        student_id = raw_data["student_id"]
        name = raw_data["name"]
        phone = raw_data["phone"]
        user = super(SocialSignupForm, self).save(request)
        user.username = student_id
        user.first_name = ""
        user.last_name = ""
        user.save()
        metadata = Metadata()
        metadata.user = user
        metadata.student_id = student_id
        metadata.name = name
        metadata.phone = phone
        metadata.save()
        return user