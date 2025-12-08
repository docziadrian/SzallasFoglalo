import json

INPUT_FILE = "szallasok.json"  
OUTPUT_FILE = "output.sql"

def sql_escape(value: str) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"

def sql_bool(value):
    if value is None:
        return "NULL"
    return "1" if value else "0"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

sql = []

# ----------------------------
# CREATE TABLE
# ----------------------------

sql.append("""
DROP TABLE IF EXISTS accomodation_images;
DROP TABLE IF EXISTS accomodations;

CREATE TABLE accomodations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    url TEXT,
    cover_image TEXT,
    title VARCHAR(255),
    description LONGTEXT,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    street VARCHAR(255),
    full_address VARCHAR(500)
);

CREATE TABLE accomodation_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accomodation_id INT,
    image_id VARCHAR(50),
    img_name VARCHAR(255),
    image_title VARCHAR(255),
    type_id INT,
    type VARCHAR(50),
    sub_index INT,
    webp BOOLEAN,
    wellness_text TEXT,
    small TEXT,
    medium TEXT,
    original TEXT,
    src TEXT,
    thumb TEXT,
    FOREIGN KEY (accomodation_id) REFERENCES accomodations(id)
);
""")

# ----------------------------
# INSERT GENERÁLÁS
# ----------------------------

accomodation_id = 1

for hotel in data:

    address = hotel.get("address", {})

    sql.append(f"""
INSERT INTO accomodations
(name, url, cover_image, title, description, postal_code, city, street, full_address)
VALUES (
{sql_escape(hotel.get("name"))},
{sql_escape(hotel.get("url"))},
{sql_escape(hotel.get("cover_image"))},
{sql_escape(hotel.get("title"))},
{sql_escape(hotel.get("description"))},
{sql_escape(address.get("postal_code"))},
{sql_escape(address.get("city"))},
{sql_escape(address.get("street"))},
{sql_escape(address.get("full_address"))}
);
""")

    images = hotel.get("images", [])

    for img in images:
        sql.append(f"""
INSERT INTO accomodation_images
(accomodation_id, image_id, img_name, image_title, type_id, type, sub_index, webp,
 wellness_text, small, medium, original, src, thumb)
VALUES (
{accomodation_id},
{sql_escape(img.get("imageId"))},
{sql_escape(img.get("imgName"))},
{sql_escape(img.get("imageTitle"))},
{img.get("typeId", 0)},
{sql_escape(img.get("type"))},
{img.get("subIndex", 0)},
{sql_bool(img.get("webP"))},
{sql_escape(img.get("wellnessText"))},
{sql_escape(img.get("small"))},
{sql_escape(img.get("medium"))},
{sql_escape(img.get("original"))},
{sql_escape(img.get("src"))},
{sql_escape(img.get("thumb"))}
);
""")

    accomodation_id += 1

# ----------------------------
# OUTPUT.SQL KIÍRÁS
# ----------------------------

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.writelines(sql)

print("✅ Kész! output.sql létrehozva.")
