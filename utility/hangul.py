def pronounce_last_digit(str_number):
    num = str_number
    last_digit = num[-1]
    pron = (
        "공"
        if last_digit == "0"
        else "일"
        if last_digit == "1"
        else "이"
        if last_digit == "2"
        else "삼"
        if last_digit == "3"
        else "사"
        if last_digit == "4"
        else "오"
        if last_digit == "5"
        else "육"
        if last_digit == "6"
        else "칠"
        if last_digit == "7"
        else "팔"
        if last_digit == "8"
        else "구"
        if last_digit == "9"
        else None
    )
    str_pron = pron
    return str_pron


def handle_hangul(str_word, str_handling_type, boolean_merge):
    word = str_word
    type = str_handling_type
    merge = boolean_merge
    last_letter = [word[-1] if not word.isdigit() else pronounce_last_digit(word)][0]
    has_batchim = (ord(last_letter) - ord("가")) % 28 > 0
    if type == "을를":
        element = "을" if has_batchim else "를"
    elif type == "이가":
        element = "이" if has_batchim else "가"
    elif type == "은는":
        element = "은" if has_batchim else "는"
    elif type == "와과":
        element = "과" if has_batchim else "와"
    elif type == "이에요예요":
        element = "이에요" if has_batchim else "예요"
    result = word + element if merge else element
    str_result = result
    return str_result
