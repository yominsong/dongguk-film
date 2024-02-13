from django import template
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

    return value[:2] + '*' * (len(value) - 5) + value[-3:]