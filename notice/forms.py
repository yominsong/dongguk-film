from django import forms
from django_ckeditor_5.widgets import CKEditor5Widget
from .models import Notice


class NoticeForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["text"].required = False

    class Meta:
        model = Notice
        fields = "__all__"
