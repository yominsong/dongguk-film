# Generated by Django 4.1.7 on 2024-01-13 17:13

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="RentalApplication",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "student_id",
                    models.CharField(
                        blank=True, max_length=10, null=True, verbose_name="학번"
                    ),
                ),
                (
                    "purpose_priority",
                    models.CharField(
                        blank=True, max_length=1, null=True, verbose_name="목적 우선순위"
                    ),
                ),
                ("equipment", models.JSONField(verbose_name="기자재")),
            ],
        ),
    ]
