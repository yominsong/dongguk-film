from django import template
import random

register = template.Library()


@register.filter
def shuffle(arg):
    aux = list(arg[:])
    random.shuffle(aux)
    return aux


@register.filter
def replace_space_with_newline(value):
    if len(value) > 7:
        return value.replace(" ", "\n")
    return value
