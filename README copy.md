# SzallasFoglalo

Szállásfoglaló Webes Applikáció Angular frontend és Express backend.

Ebben a szállásfoglaló webes projektben a felhasználók szállásokat tudnak foglalni.
Az elérhető szállások a https://szallas.hu/ oldalról származnak.

# Fő Technológiák:

    - Angular - Frontend
    - Tailwind - CSS framework
    - Express - Backend
    - Nodemailer - E-mail küldés
    - Multer - Képfeltöltés
    - FullCalendar - Naptár
    - i18n - Többnyelvű felület
    - Stripe és Barion - Fizetés implementáció
    - MySQL - Adatbázis
    - Admin panel

# Adatbázis

Táblák:

accomodations:

- name: str,
- url: str,
- cover_image: str,
- title: str,
- description: str,
- address {
  "postal code": str,
  "city": str,
  "street": str,
  "full_address": str
  },
- images: array[] {
  "imageId": str,
  "imgName": str,
  "imageTitle": str,
  "typeId": int,
  "type": str,
  "subIndex": int,
  "webP": boolean,
  "wellnessText": str,
  "small": str,
  "medium": str,
  "original": str,
  "src": str,
  "thumb": str
  },
- rating: {
  "value": float | null,
  "best_rating": float | null,
  "worst_rating": float | null,
  "text": null,
  "review_count": int | null,
  "details": [],
  "tags": []
  },
- rooms: []
- cheapest_price: null
- cheapest_price_currency: null
- policy: array[] {
  "title": str,
  "description": str
  },
- hotel_type: str,
- partner_hotel_id: int,
- coordinates: {}
- services: array[] {
  "title": str,
  "description": str
  },
- top_services: []

Készítette: Dóczi Adrián Márk
