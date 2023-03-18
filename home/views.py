from django.shortcuts import render
from .utils import *


def home(request):
    return render(request, "home/home.html")
