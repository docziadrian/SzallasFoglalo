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

# Képek:

    - Logó: NanoBanana AI által generált.
    Prompt: "Minimalist flat-style logo representing hotels and accommodations; clean geometric shapes, simple lines, abstract hotel or building icon; modern and professional design in a red and white color scheme; vector-style, bold but simple, no realistic textures."
    - Szállások képek: https://szallas.hu oldalról

# AI CHAT ablak:

    - Szolgáltató: OpenRouter
    - AI modell: openai/gpt-oss-20b:free

# Fizetés:

    - Szolgáltató: Stripe
        - stripeaccountszallasokhoz@gmail.hu
    - Ingyen kredites kártya működik csak.
    - Kártya:
    	- Szám: 4242424242424242
    	- CVC: mindegy
    	- Date: mindegy, csak jövőbeli

# Többnyelvűség
	- Az egész oldalakon szereplő összes frontend szöveg 3 nyelven elérhető:
		- magyar (alapértelmezett)
		- angol
		- német
	- A nyelvet az oldal bal alsó sarkában lévő ikonnal lehet megváltoztatni (absolute pozicio)

# Email küldése
A nodemailer a következő események bekövetkezésekor fog emailt küldeni a felhasználónak:
	- sikeres regisztráció
	- sikeres foglalás (user neve, accomodation, startdate, enddate éjszakák száma, személyek száma, végösszeg, igazolva (automatikusan TRUE))

# Szállás
	- Csak akkor látható, ha active a státusza
	
# Szerepkörök:
	- user: alapértelmezett, aktív: active, default role: user
		* ha beregisztrál, automatikus roleja: "user"
	- admin (a /admin panel csak ezzel a szerepkörrel rendelkező egyed tudja elérni)

# Admin panel (módosítás) - 
	- Egy plusz menüpont (card):
		* foglalások. ebben a szekcióban a lefoglalt adatokat tudja megtekinteni
			* lefoglalt szállás, startDate, endDate, user neve, éjszakák száma, személyek száma, végösszeg, minden adat...
	- Minden szekciónál (felhasználók, szállások, vélemények) legyen pagination (pagináció)!
	
# Admin panel:
	- Színek: piros (red-600), fekete (black)
	- Tailwind (általában table -view) frontenden
	- Itt is van Landing Page, 3 card középen -> ki tudja választani, mit szeretne
	- Szerethet:
		- Felhasználók kezelése
			* Felhasználók kezelése (CRUD műveletek + felhasználó kitiltása)
		- Szállások kezelése
			* Új szállás hozzáadása
				- Mivel a bevitt adatbázis adatok egy már meglévő szállás adatait tartalmazzák (szállás kép url, stb..)
				ezért ezt külön kell kezelnünk.
				Az admin kap egy képfeltöltős inputot, feltölti, felmegy imgBB -re.
				A feltöltött kép URL -jét fogjuk használni.
				// Feltöltés ImgBB re
			  const imgbbApiKey = '1167681f3465f44a5054da3cb1406b22'; // TESZT API KEY
			  const response = await fetch(
				`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
				{
				  method: 'POST',
				  body: formData,
				}
			  );
		- Megjegyzések kezelése
			* Full CRUD műveletek, html table view, módosítás popup modal stb...
	  

Készítette: Dóczi Adrián Márk


