# from django.conf import settings
# from django.http import JsonResponse
# from django.utils import timezone
# import xml.etree.ElementTree as ET
# import asyncio, aiohttp, time

# KAKAO = getattr(settings, "KAKAO", None)
# KAKAO_REST_API_KEY = KAKAO["REST_API_KEY"]
# PUBLIC_DATA = getattr(settings, "PUBLIC_DATA", None)
# PUBLIC_DATA_SERVICE_KEY = PUBLIC_DATA["SERVICE_KEY"]

# #
# # Sub functions
# #


# def st(hhmm):  # set time
#     now = timezone.now()
#     hh = int(hhmm[:2])
#     mm = int(hhmm[2:])
#     return now.replace(hour=hh, minute=mm)


# def get_base_date_time(type: str, option: str):
#     """
#     - type | `str`:
#         - UST: Ultra Short Term
#         - STM: Short Term
#         - SUN: Sunrise and Sunset
#     - option | `str`:
#         - BDT, TMX, TMN: refer to `weather()` function annotation
#     """

#     now = timezone.now()
#     yymmdd = now.strftime("%Y%m%d")
#     hhmm = now.strftime("%H%M")

#     # type: "UST"
#     if type == "UST":
#         if st(hhmm) < st("0040"):
#             base_date = (now - timezone.timedelta(days=1)).strftime("%Y%m%d")
#             base_time = "2300"
#         else:
#             base_times = {
#                 "0040": "0000",
#                 "0140": "0100",
#                 "0240": "0200",
#                 "0340": "0300",
#                 "0440": "0400",
#                 "0540": "0500",
#                 "0640": "0600",
#                 "0740": "0700",
#                 "0840": "0800",
#                 "0940": "0900",
#                 "1040": "1000",
#                 "1140": "1100",
#                 "1240": "1200",
#                 "1340": "1300",
#                 "1440": "1400",
#                 "1540": "1500",
#                 "1640": "1600",
#                 "1740": "1700",
#                 "1840": "1800",
#                 "1940": "1900",
#                 "2040": "2000",
#                 "2140": "2100",
#                 "2240": "2200",
#                 "2340": "2300",
#             }
#             hhmm_key = max([k for k in base_times.keys() if st(k) <= st(hhmm)])
#             base_date = yymmdd
#             base_time = base_times[hhmm_key]
#         if option == "BDT":
#             base_date = f"{base_date[4:6]}월 {base_date[6:]}일"
#             base_time = f"{base_time[:2]}시"

#     # type: "STM"
#     elif type == "STM" and option == None:
#         if st(hhmm) < st("0210"):
#             base_date = (now - timezone.timedelta(days=2)).strftime("%Y%m%d")
#             base_time = "2300"
#         else:
#             base_times = {
#                 "0210": "0200",
#                 "0510": "0500",
#                 "0810": "0800",
#                 "1110": "1100",
#                 "1410": "1400",
#                 "1710": "1700",
#                 "2010": "2000",
#                 "2310": "2300",
#             }
#             hhmm_key = max([k for k in base_times.keys() if st(k) <= st(hhmm)])
#             base_date = yymmdd
#             base_time = base_times[hhmm_key]
#     elif type == "STM" and option == "TMX":
#         if st(hhmm) < st("0210"):
#             base_date = (now - timezone.timedelta(days=2)).strftime("%Y%m%d")
#             base_time = "2300"
#         else:
#             base_times = {
#                 "0210": "0200",
#                 "0510": "0500",
#                 "0810": "0800",
#                 "1110": "1100",
#             }
#             hhmm_key = max([k for k in base_times.keys() if st(k) <= st(hhmm)])
#             base_date = yymmdd
#             base_time = base_times[hhmm_key]
#     elif type == "STM" and option == "TMN":
#         if st(hhmm) < st("0210"):
#             base_date = (now - timezone.timedelta(days=2)).strftime("%Y%m%d")
#             base_time = "2300"
#         elif st("0210") <= st(hhmm):
#             base_date = yymmdd
#             base_time = "0200"
    
#     # type: "SUN"
#     elif type == "SUN":
#         base_date = yymmdd
#         base_time = None

#     return {"bd": base_date, "bt": base_time}


# def find_value_from_text(category: str, text: str):
#     """
#     - category | `str`:
#         - T1H, PTY, WSD, POP, SKY, TMX, TMN: refer to `weather()` function annotation
    
#     - text | `str`: Response text for HTTP request
#     """

#     try:
#         root = ET.fromstring(text)
#         if category in ["T1H", "PTY", "WSD"]:
#             value_type = "obsrValue"
#         elif category in ["POP", "SKY", "TMX", "TMN"]:
#             value_type = "fcstValue"
#         result = root.find(f".//item[category='{category}']").find(value_type).text

#     except:
#         default_values = {
#             "T1H": "--.-",
#             "PTY": "-",
#             "WSD": "-.-",
#             "POP": "--",
#             "SKY": "-",
#             "TMX": "--.-",
#             "TMN": "--.-"
#         }
#         result = default_values[category]

#     return result


# #
# # Main functions
# #


# async def weather(request):
#     """
#     - ADR: Address
#     - T1H: Current Temperature
#     - PTY: Precipitation Type
#     - WSD: Wind Speed
#     - WNM: Wind Name
#     - SKY: Sky State
#     - POP: Probability of Precipitation
#     - TMX: Maximum Temperature
#     - TMN: Minimum Temperature
#     - SUR: Sunrise
#     - SUS: Sunset
#     - ACC: Accuracy
#     - BDT: Base Date and Time
#     """

#     if request.GET["id"] == "weather":
#         id = request.GET["id"]
#         lng = request.GET["lng"]
#         lat = request.GET["lat"]
#         x = request.GET["x"]
#         y = request.GET["y"]
#         acc = request.GET["acc"]

#         futures = {
#             "adr": adr(lng, lat),
#             "t1h_pty_wsd_wnm": t1h_pty_wsd_wnm(x, y),
#             "pop_sky": pop_sky(x, y),
#             "tmx_tmn": tmx_tmn(x, y),
#             "sur_sus": sur_sus(lng, lat),
#             "acc_bdt": acc_bdt(acc)
#         }

#         results = {}

#         for key in futures:
#             try:
#                 results[key] = await asyncio.wait_for(futures[key], timeout=2.5)
#             except asyncio.TimeoutError:
#                 results[key] = None

#         ADR = results["adr"]
#         T1H, PTY, WSD, WNM = results["t1h_pty_wsd_wnm"] if results["t1h_pty_wsd_wnm"] != None else ("--.-℃", "-", "-.-m/s", "-")
#         POP, SKY = results["pop_sky"] if results["pop_sky"] != None else ("--%", "-")
#         TMX, TMN = results["tmx_tmn"] if results["tmx_tmn"] != None else ("--.-℃", "--.-℃")
#         SUR, SUS = results["sur_sus"] if results["sur_sus"] != None else ("--:--", "--:--")
#         ACC, BDT = results["acc_bdt"] if results["acc_bdt"] != None else ("위치 정보 없음", "--월 --일 --시 발표")

#         response = {
#             "id": id,
#             "result": {
#                 "address": ADR,
#                 "temperature": T1H,
#                 "precipitationType": PTY,
#                 "windSpeed": WSD,
#                 "windName": WNM,
#                 "skyState": SKY,
#                 "precipitationProbability": POP,
#                 "temperatureMax": TMX,
#                 "temperatureMin": TMN,
#                 "sunrise": SUR,
#                 "sunset": SUS,
#                 "accuracy": ACC,
#                 "baseDateTime": BDT,
#             },
#         }

#         return JsonResponse(response)
    

# async def adr(lng, lat):
#     start_time = time.time()
#     url = "https://dapi.kakao.com/v2/local/geo/coord2address.json"
#     params = {"x": lng, "y": lat, "input_coord": "WGS84"}
#     headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url, params=params, headers=headers) as response:
#             json = await response.json()

#     adr = json["documents"][0]["address"]
#     r1 = adr["region_1depth_name"]
#     r2 = adr["region_2depth_name"]
#     r3 = adr["region_3depth_name"]

#     ADR = f"{r1} {r2} {r3}"
#     print(f'adr execution time: {time.time() - start_time} seconds')

#     return ADR


# async def t1h_pty_wsd_wnm(x, y):
#     start_time = time.time()
#     url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
#     params = {
#         "serviceKey": PUBLIC_DATA_SERVICE_KEY,
#         "base_date": get_base_date_time("UST", None)["bd"],
#         "base_time": get_base_date_time("UST", None)["bt"],
#         "nx": x,
#         "ny": y,
#     }

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url, params=params) as response:
#             text = await response.text()

#     pty_map = {
#         "0": "강수 없음",
#         "1": "비",
#         "2": "비/눈",
#         "3": "눈",
#         "4": "소나기",
#         "5": "빗방울",
#         "6": "빗방울/눈날림",
#         "7": "눈날림",
#     }
#     wsd = float(find_value_from_text("WSD", text))
#     wnm_map = {
#         0: "고요",
#         0.3: "실바람",
#         1.6: "남실바람",
#         3.4: "산들바람",
#         5.5: "건들바람",
#         8.0: "흔들바람",
#         10.8: "된바람",
#         13.9: "센바람",
#         17.2: "큰바람",
#         20.8: "큰센바람",
#         24.5: "노대바람",
#         28.5: "왕바람",
#         32.7: "싹쓸바람",
#     }

#     T1H = find_value_from_text("T1H", text) + "℃"
#     PTY = pty_map.get(find_value_from_text("PTY", text), "-")
#     WSD = str(wsd) + "m/s"
#     WNM = next((wnm_map[wnm] for wnm in wnm_map.keys() if wsd <= wnm), "-")
#     print(f't1h_pty_wsd_wnm execution time: {time.time() - start_time} seconds')

#     return T1H, PTY, WSD, WNM


# async def pop_sky(x, y):
#     start_time = time.time()
#     url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
#     params = {
#         "serviceKey": PUBLIC_DATA_SERVICE_KEY,
#         "base_date": get_base_date_time("STM", None)["bd"],
#         "base_time": get_base_date_time("STM", None)["bt"],
#         "nx": x,
#         "ny": y,
#     }

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url, params=params) as response:
#             text = await response.text()

#     sky_map = {
#         "1": "맑음",
#         "3": "구름 많음",
#         "4": "흐림",
#     }

#     POP = find_value_from_text("POP", text) + "%"
#     SKY = sky_map.get(find_value_from_text("SKY", text), "-")
#     print(f'pop_sky execution time: {time.time() - start_time} seconds')

#     return POP, SKY


# async def tmx_tmn(x, y):
#     start_time = time.time()
#     url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
#     results = []
#     categories = ["TMX", "TMN"]
#     for i, category in enumerate(categories):
#         params = {
#             "serviceKey": PUBLIC_DATA_SERVICE_KEY,
#             "base_date": get_base_date_time("STM", category)["bd"],
#             "base_time": get_base_date_time("STM", category)["bt"],
#             "nx": x,
#             "ny": y,
#             "numOfRows": 200,
#         }

#         async with aiohttp.ClientSession() as session:
#             async with session.get(url, params=params) as response:
#                 text = await response.text()
        
#         results.append(find_value_from_text(category, text))

#         if i < len(categories) - 1:
#             await asyncio.sleep(0.3)
    
#     TMX = results[0] + "℃"
#     TMN = results[1] + "℃"
#     print(f'tmx_tmn execution time: {time.time() - start_time} seconds')

#     return TMX, TMN


# async def sur_sus(lng, lat):
#     start_time = time.time()
#     url = "http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo"
#     params = {
#         "ServiceKey": PUBLIC_DATA_SERVICE_KEY,
#         "longitude": lng,
#         "latitude": lat,
#         "locdate": get_base_date_time("SUN", None)["bd"],
#         "dnYn": "Y",
#     }

#     async with aiohttp.ClientSession() as session:
#         async with session.get(url, params=params) as response:
#             text = await response.text()
    
#     root = ET.fromstring(text)
#     sunrise = timezone.datetime.strptime(
#         root.find(".//sunrise").text.strip(), "%H%M"
#     )
#     sunset = timezone.datetime.strptime(root.find(".//sunset").text.strip(), "%H%M")

#     SUR = sunrise.strftime("%H:%M")
#     SUS = sunset.strftime("%H:%M")
#     print(f'sur_sus execution time: {time.time() - start_time} seconds')

#     return SUR, SUS


# async def acc_bdt(acc):
#     start_time = time.time()
#     acc = float(acc) if acc else None

#     ACC = "위치 정보 없음" if not acc else f"약 {round(acc / 1000)}km 오차" if acc >= 1000 else f"약 {round(acc)}m 오차"
#     BDT = f"{(get_base_date_time('UST', 'BDT')['bd'])} {get_base_date_time('UST', 'BDT')['bt']} 발표"
#     print(f'acc_bdt execution time: {time.time() - start_time} seconds')

#     return ACC, BDT