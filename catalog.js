"use strict";
/* قائمة محلية مختصرة. ليست سجلًا شاملًا ولا متحققة آنيًا؛ null = غير محدد (يختلف حسب النسخة). */
window.DEVICE_CATALOG = {
  "Samsung": [
    ["Galaxy A10s","2019","MediaTek Helio P22","2–3 GB","60 Hz"],
    ["Galaxy A12","2020","MediaTek Helio P35","3–6 GB","60 Hz"],
    ["Galaxy A13","2022","Exynos 850 / Helio G80","3–6 GB","60 Hz"],
    ["Galaxy A14","2023","Exynos 850 / Dimensity 700","4–8 GB","60 Hz"],
    ["Galaxy A15","2023","Helio G99 / Dimensity 6100+","4–8 GB","90 Hz"],
    ["Galaxy A16","2024","Exynos 1330 / Helio G99","4–8 GB","90 Hz"],
    ["Galaxy A25","2023","Exynos 1280","6–8 GB","120 Hz"],
    ["Galaxy A35","2024","Exynos 1380","6–8 GB","120 Hz"],
    ["Galaxy A55","2024","Exynos 1480","8–12 GB","120 Hz"],
    ["Galaxy S21","2021","Exynos 2100 / Snapdragon 888","8 GB","120 Hz"],
    ["Galaxy S22","2022","Exynos 2200 / Snapdragon 8 Gen 1","8 GB","120 Hz"],
    ["Galaxy S23","2023","Snapdragon 8 Gen 2","8–12 GB","120 Hz"],
    ["Galaxy S24","2024","Exynos 2400 / Snapdragon 8 Gen 3","8–12 GB","120 Hz"],
    ["Galaxy S25","2025","Snapdragon 8 Elite","12 GB","120 Hz"],
    ["Galaxy M14","2023","Exynos 1330","4–6 GB","90 Hz"],
    ["Galaxy M15","2024","Dimensity 6100+","4–6 GB","90 Hz"]
  ],
  "Apple": [
    ["iPhone 11","2019","Apple A13 Bionic","4 GB","60 Hz"],
    ["iPhone 12","2020","Apple A14 Bionic","4 GB","60 Hz"],
    ["iPhone 13","2021","Apple A15 Bionic","4 GB","60 Hz"],
    ["iPhone 14","2022","Apple A15 Bionic","6 GB","60 Hz"],
    ["iPhone 15","2023","Apple A16 Bionic","6 GB","60 Hz"],
    ["iPhone 16","2024","Apple A18","8 GB","60 Hz"],
    ["iPhone 16 Pro","2024","Apple A18 Pro","8 GB","120 Hz"],
    ["iPhone 17","2025","Apple A19","8 GB","120 Hz"],
    ["iPhone 17 Pro","2025","Apple A19 Pro","12 GB","120 Hz"]
  ],
  "Xiaomi": [
    ["Xiaomi 13","2023","Snapdragon 8 Gen 2","8–12 GB","120 Hz"],
    ["Xiaomi 14","2024","Snapdragon 8 Gen 3","12–16 GB","120 Hz"],
    ["Xiaomi 15","2025","Snapdragon 8 Elite","12–16 GB","120 Hz"]
  ],
  "POCO": [
    ["POCO M5","2022","MediaTek Helio G99","4–6 GB","90 Hz"],
    ["POCO X5 Pro","2023","Snapdragon 778G","6–8 GB","120 Hz"],
    ["POCO X6","2024","Snapdragon 7s Gen 2","8–12 GB","120 Hz"],
    ["POCO X6 Pro","2024","Dimensity 8300 Ultra","8–12 GB","120 Hz"],
    ["POCO F6","2024","Snapdragon 8s Gen 3","8–12 GB","120 Hz"],
    ["POCO F7","2025",null,null,null]
  ],
  "Redmi": [
    ["Redmi 12","2023","MediaTek Helio G88","4–8 GB","90 Hz"],
    ["Redmi 13","2024","MediaTek Helio G91 Ultra","6–8 GB","90 Hz"],
    ["Redmi Note 12","2023","Snapdragon 685","4–8 GB","120 Hz"],
    ["Redmi Note 13","2024","Snapdragon 685 / Dimensity 6080","6–12 GB","120 Hz"],
    ["Redmi Note 14","2025",null,null,null],
    ["Redmi 9A","2020","MediaTek Helio G25","2–6 GB","60 Hz"],
    ["Redmi 10","2021","MediaTek Helio G88","4–6 GB","90 Hz"],
    ["Redmi 12C","2023","MediaTek Helio G85","3–6 GB","60 Hz"],
    ["Redmi 13C","2023","MediaTek Helio G85","4–8 GB","90 Hz"],
    ["Redmi A3","2024","MediaTek Helio G36","3–6 GB","90 Hz"]
  ],
  "Huawei": [
    ["P30 Lite","2019","Kirin 710","4–8 GB","60 Hz"],
    ["P30 Pro","2019","Kirin 980","6–8 GB","60 Hz"],
    ["Nova 9","2021","Snapdragon 778G","8 GB","120 Hz"],
    ["Nova 11","2023","Snapdragon 778G","8 GB","120 Hz"],
    ["Nova 12","2024",null,null,null]
  ],
  "HONOR": [
    ["X7b","2023","Snapdragon 680","6–8 GB","90 Hz"],
    ["X8b","2023","Snapdragon 680","8 GB","90 Hz"],
    ["X9b","2023","Snapdragon 6 Gen 1","8–12 GB","120 Hz"],
    ["200","2024","Snapdragon 7 Gen 3","8–12 GB","120 Hz"],
    ["Magic7 Pro","2025","Snapdragon 8 Elite","12–16 GB","120 Hz"]
  ],
  "OPPO": [
    ["A58","2023","Helio G85 / Dimensity 700","6–8 GB",null],
    ["A78","2023","Snapdragon 680 / Dimensity 700","8 GB","90 Hz"],
    ["Reno 10","2023","Dimensity 7050","8 GB","120 Hz"],
    ["Reno 11","2024","Dimensity 7050","8–12 GB","120 Hz"],
    ["Reno 12","2024","Dimensity 7300","12 GB","120 Hz"]
  ],
  "Vivo": [
    ["Y21","2021","MediaTek Helio P35","4 GB","60 Hz"],
    ["Y22","2022","MediaTek Helio G85","4–6 GB","90 Hz"],
    ["Y27","2023","Helio G85 / Dimensity 6020","6–8 GB",null],
    ["V29","2023","Snapdragon 778G","8–12 GB","120 Hz"],
    ["V30","2024","Snapdragon 7 Gen 3","8–12 GB","120 Hz"]
  ],
  "Realme": [
    ["C55","2023","MediaTek Helio G88","4–8 GB","90 Hz"],
    ["C67","2023","Snapdragon 685","6–8 GB","90 Hz"],
    ["12 Pro","2024","Snapdragon 6 Gen 1","8–12 GB","120 Hz"],
    ["13 Pro+","2024","Snapdragon 7s Gen 2","8–12 GB","120 Hz"]
  ],
  "Infinix": [
    ["Hot 30","2023","MediaTek Helio G88","4–8 GB","90 Hz"],
    ["Hot 40 Pro","2023","MediaTek Helio G99","8 GB","120 Hz"],
    ["Hot 50 Pro+","2024","MediaTek Helio G100","8 GB","120 Hz"],
    ["Note 30","2023","MediaTek Helio G99","8 GB","120 Hz"],
    ["Note 40","2024","Helio G99 Ultimate","8 GB","120 Hz"],
    ["GT 20 Pro","2024","Dimensity 8200 Ultimate","8–12 GB","144 Hz"]
  ],
  "TECNO": [
    ["Spark 10","2023","MediaTek Helio G37","4–8 GB","90 Hz"],
    ["Spark 20","2023","MediaTek Helio G85","4–8 GB","90 Hz"],
    ["Spark 20 Pro","2023","MediaTek Helio G99","8 GB","120 Hz"],
    ["Camon 20","2023","MediaTek Helio G85","8 GB","60 Hz"],
    ["Camon 30","2024","Helio G99 Ultimate","8–12 GB","120 Hz"],
    ["Pova 6 Pro","2024","Dimensity 6080","8–12 GB","120 Hz"]
  ],
  "OnePlus": [
    ["Nord CE 3 Lite","2023","Snapdragon 695","8 GB","120 Hz"],
    ["Nord 3","2023","Dimensity 9000","8–16 GB","120 Hz"],
    ["Nord 4","2024","Snapdragon 7+ Gen 3","8–16 GB","120 Hz"],
    ["OnePlus 12","2024","Snapdragon 8 Gen 3","12–24 GB","120 Hz"],
    ["OnePlus 13","2025","Snapdragon 8 Elite","12–24 GB","120 Hz"]
  ],
  "ZTE": [
    ["Blade A31","2021","Unisoc SC9863A","2 GB","60 Hz"],
    ["Blade A51","2021","Unisoc SC9863A","2–3 GB","60 Hz"],
    ["Blade V40","2022",null,null,null],
    ["Nubia Neo","2023","Unisoc T820","8 GB","120 Hz"],
    ["RedMagic 9 Pro","2023","Snapdragon 8 Gen 3","12–16 GB","120 Hz"],
    ["RedMagic 10 Pro","2024","Snapdragon 8 Elite","12–24 GB","144 Hz"]
  ],
  "Motorola": [
    ["Moto G54","2023","Dimensity 7020","8–12 GB","120 Hz"],
    ["Moto G84","2023","Snapdragon 695","8–12 GB","120 Hz"],
    ["Edge 40","2023","Dimensity 8020","8 GB","144 Hz"],
    ["Edge 50 Pro","2024","Snapdragon 7 Gen 3","8–12 GB","144 Hz"]
  ],
  "Google": [
    ["Pixel 6","2021","Google Tensor","8 GB","90 Hz"],
    ["Pixel 7","2022","Google Tensor G2","8 GB","90 Hz"],
    ["Pixel 8","2023","Google Tensor G3","8 GB","120 Hz"],
    ["Pixel 9","2024","Google Tensor G4","12 GB","120 Hz"]
  ],
  "ASUS": [
    ["ROG Phone 7","2023","Snapdragon 8 Gen 2","12–16 GB","165 Hz"],
    ["ROG Phone 8","2024","Snapdragon 8 Gen 3","12–24 GB","165 Hz"],
    ["ROG Phone 9","2024","Snapdragon 8 Elite","12–24 GB","185 Hz"]
  ],
  "Sony": [
    ["Xperia 1 V","2023","Snapdragon 8 Gen 2","12 GB","120 Hz"],
    ["Xperia 1 VI","2024","Snapdragon 8 Gen 3","12–16 GB","120 Hz"]
  ],
  "Nothing": [
    ["Phone (1)","2022","Snapdragon 778G+","8–12 GB","120 Hz"],
    ["Phone (2)","2023","Snapdragon 8+ Gen 1","8–12 GB","120 Hz"],
    ["Phone (2a)","2024","Dimensity 7200 Pro","8–12 GB","120 Hz"],
    ["Phone (3a)","2025","Snapdragon 7s Gen 3","8–12 GB","120 Hz"]
  ]
};
