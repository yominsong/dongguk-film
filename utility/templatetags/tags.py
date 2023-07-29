from django import template
import random

register = template.Library()


@register.filter
def shuffle(arg):
    aux = list(arg[:])
    random.shuffle(aux)
    return aux
