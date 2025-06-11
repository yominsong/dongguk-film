from django import template
from ..hangul import handle_hangul
import random

register = template.Library()


@register.filter(name="shuffle")
def shuffle(arg):
    aux = list(arg[:])
    random.shuffle(aux)

    return aux


@register.filter(name="replace_space_with_newline")
def replace_space_with_newline(value, length):
    if len(value) >= int(length):
        return value.replace(" ", "\n")

    return value


@register.filter(name="mask_student_id")
def mask_student_id(value):
    if not isinstance(value, str):
        value = str(value)

    return value[:2] + "*" * (len(value) - 5) + value[-3:]


@register.filter(name="handle_hangul")
def handle_hangul_filter(word: str, handling_type: str, merge: bool = False):
    return handle_hangul(word, handling_type, merge)


@register.simple_tag(takes_context=True)
def replace_query_param(context, **kwargs):
    query = context["request"].GET.copy()
    for k, v in kwargs.items():
        if v is None:
            query.pop(k, None)
        else:
            query[k] = v
    return (
        f"{context['request'].path}?{query.urlencode()}"
        if query
        else context["request"].path
    )