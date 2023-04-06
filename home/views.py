from django.shortcuts import render


def home(request):
    return render(request, "home/home.html")


def error_400(request, exception):
    return render(request, "error/400.html")


def error_404(request, exception):
    return render(request, "error/404.html")


def error_408(request, exception):
    return render(request, "error/408.html")


def error_500(request, exception):
    return render(request, "error/500.html")


def error_502(request, exception):
    return render(request, "error/502.html")
