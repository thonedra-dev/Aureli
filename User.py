# path: User.py

from flask import Blueprint, jsonify, request
from flask_cors import CORS
import mysql.connector
import traceback
import os
from werkzeug.utils import secure_filename

# Blueprint for users
users_bp = Blueprint("users_bp", __name__)
CORS(users_bp)

# Filesystem base directory (folder where this User.py lives)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Filesystem folder where uploads are stored
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",  # TODO: change to your real password or use env var
        database="aureli",
        port=4306,
    )


def normalize_profile_pic_path(path: str | None) -> str | None:
    """Ensure profile_pic is a web URL path under /static/uploads."""
    if not path:
        return None

    # Normalize slashes
    norm = path.replace("\\", "/")

    # If DB has "uploads/filename.png", prefix with "/static/"
    if norm.startswith("uploads/"):
        norm = f"/static/{norm}"

    # If it already starts with "/static/", keep it
    if not norm.startswith("/static/"):
        # Last fallback: treat it as a filename only
        norm = f"/static/uploads/{os.path.basename(norm)}"

    return norm


# -------------------- Registration --------------------


@users_bp.route("/api/register", methods=["POST"])
def register_user():
    try:
        data = request.get_json() or {}

        username = data.get("username")
        email_address = data.get("email_address")
        contact_number = data.get("contact_number")
        password = data.get("password")
        nationality = data.get("nationality")
        gender = data.get("gender")
        age = data.get("age")

        if not username or not email_address or not password:
            return jsonify(
                {"message": "Username, email, and password are required"}
            ), 400

        valid_genders = ("Male", "Female", "Other")
        if gender is not None and gender not in valid_genders:
            return jsonify(
                {
                    "message": f"Invalid gender value. Expected one of {valid_genders}."
                }
            ), 400

        if age is not None:
            try:
                age = int(age)
                if age < 0:
                    return jsonify(
                        {"message": "Age must be a non-negative integer"}
                    ), 400
            except (TypeError, ValueError):
                return jsonify({"message": "Age must be an integer"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT user_id
            FROM users
            WHERE username = %s OR email_address = %s
            """,
            (username, email_address),
        )
        existing_user = cursor.fetchone()
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"message": "Username or email already exists"}), 400

        cursor.execute(
            """
            INSERT INTO users
                (username, email_address, contact_number, password,
                 nationality, gender, age)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                username,
                email_address,
                contact_number,
                password,
                nationality,
                gender,
                age,
            ),
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error registering user: {str(e)}"}), 500


# -------------------- Latest Products --------------------


@users_bp.route("/api/products/latest", methods=["GET"])
def fetch_latest_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        category = request.args.get("category", None)

        query = """
            SELECT product_id, shop_id, product_name, category, default_color, default_picture,
                   XS_price, S_price, M_price, L_price, XL_price, XLL_price
            FROM products
            WHERE is_active = 1
        """

        if category and category != "Home":
            query += " AND category = %s"

        query += " ORDER BY created_at DESC, product_name ASC"

        if category and category != "Home":
            cursor.execute(query, (category,))
        else:
            cursor.execute(query)

        products = cursor.fetchall()

        # Compute min_size/min_price and normalize picture URLs
        for product in products:
            sizes = ["XS", "S", "M", "L", "XL", "XLL"]
            prices = {size: product[f"{size}_price"] for size in sizes}
            valid_prices = {size: price for size, price in prices.items() if price is not None}

            if valid_prices:
                min_size = min(valid_prices, key=valid_prices.get)
                min_price = valid_prices[min_size]
                product["min_size"] = min_size
                product["min_price"] = min_price
            else:
                product["min_size"] = None
                product["min_price"] = None

            if product["default_picture"]:
                product["default_picture"] = product["default_picture"].replace("\\", "/")
            else:
                product["default_picture"] = None

        cursor.close()
        conn.close()

        return jsonify(products), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching latest products: {str(e)}"}), 500

# New blueprint for add-to-cart related routes
@users_bp.route('/api/add_to_cart_product_details/<int:product_id>', methods=['GET'])
def fetch_add_to_cart_product_details(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch product info (including size/price information)
        cursor.execute(''' 
            SELECT product_id, shop_id, product_name, category,
                   default_color, default_picture,
                   XS, S, M, L, XL, XLL,
                   XS_price, S_price, M_price, L_price, XL_price, XLL_price,
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock,
                   created_at
            FROM products
            WHERE product_id = %s AND is_active = 1
        ''', (product_id,))
        product = cursor.fetchone()

        if not product:
            cursor.close()
            conn.close()
            return jsonify({"message": "Product not found"}), 404

        # Normalize main product picture path
        if product['default_picture']:
            product['default_picture'] = product['default_picture'].replace("\\", "/")
        else:
            product['default_picture'] = None

        # Fetch variants (size flags + prices + stocks)
        cursor.execute(''' 
            SELECT variance_id, product_id, color, picture,
                   XS, S, M, L, XL, XLL,
                   XS_price, S_price, M_price, L_price, XL_price, XLL_price,
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock
            FROM variances
            WHERE product_id = %s
        ''', (product_id,))
        variants = cursor.fetchall()

        # Normalize variant picture paths
        for variant in variants:
            if variant['picture']:
                variant['picture'] = variant['picture'].replace("\\", "/")
            else:
                variant['picture'] = None

        cursor.close()
        conn.close()

        return jsonify({
            "product": product,
            "variants": variants
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching product details: {str(e)}"}), 500

@users_bp.route('/api/user_cart', methods=['POST', 'GET'])
def user_cart():
    try:
        if request.method == 'POST':
            data = request.get_json()

            # Extracting user inputs
            user_id = data.get('user_id')
            product_id = data.get('product_id')
            variant_id = data.get('variant_id')
            size = data.get('size')  # This is the size selected (e.g., 'S', 'M', etc.)

            # Check for mandatory fields
            if not user_id or not product_id or not size:
                return jsonify({"message": "user_id, product_id, and size are required"}), 400

            # Establish database connection
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # Initialize default picture and color
            picture = None
            color = None
            size_column = None

            # Check if variant_id is provided (variant selected)
            if variant_id is None:
                # Fetch details from products table if no variant is selected
                cursor.execute(f"""
                    SELECT product_name, category, default_picture, default_color,
                           {size}_price AS price
                    FROM products
                    WHERE product_id = %s
                """, (product_id,))
                product = cursor.fetchone()

                if not product:
                    return jsonify({"message": "Product not found"}), 404

                # Normalize picture path
                if product['default_picture']:
                    product['default_picture'] = product['default_picture'].replace("\\", "/")
                picture = product["default_picture"]
                color = product["default_color"]
                size_column = size  # This is the size column (e.g., 'S', 'M', etc.)

                # Insert into carts table
                cursor.execute(f"""
                    INSERT INTO carts (user_id, product_id, variant_id, XS, S, M, L, XL, XLL)
                    VALUES (%s, %s, NULL, 
                            {1 if size == 'XS' else 0}, 
                            {1 if size == 'S' else 0}, 
                            {1 if size == 'M' else 0}, 
                            {1 if size == 'L' else 0}, 
                            {1 if size == 'XL' else 0}, 
                            {1 if size == 'XLL' else 0})
                """, (user_id, product_id))

            else:
                # If variant_id is provided, fetch product and variant details
                cursor.execute("""
                    SELECT product_name, category
                    FROM products
                    WHERE product_id = %s
                """, (product_id,))
                product = cursor.fetchone()

                if not product:
                    return jsonify({"message": "Product not found"}), 404

                cursor.execute(f"""
                    SELECT picture, color, 
                           {size}_price AS price
                    FROM variances
                    WHERE variance_id = %s
                """, (variant_id,))
                variant = cursor.fetchone()

                if not variant:
                    return jsonify({"message": "Variant not found"}), 404

                # Normalize picture path for the variant
                if variant['picture']:
                    variant['picture'] = variant['picture'].replace("\\", "/")
                picture = variant["picture"]
                color = variant["color"]
                size_column = size  # This is the size column (e.g., 'S', 'M', etc.)

                # Insert into carts table for variant
                cursor.execute(f"""
                    INSERT INTO carts (user_id, product_id, variant_id, XS, S, M, L, XL, XLL)
                    VALUES (%s, %s, %s, 
                            {1 if size == 'XS' else 0}, 
                            {1 if size == 'S' else 0}, 
                            {1 if size == 'M' else 0}, 
                            {1 if size == 'L' else 0}, 
                            {1 if size == 'XL' else 0}, 
                            {1 if size == 'XLL' else 0})
                """, (user_id, product_id, variant_id))

            # Commit the transaction
            conn.commit()

            # Closing the database connection
            cursor.close()
            conn.close()

            # Return response with the requested information
            response = {
                "product_name": product["product_name"],
                "category": product["category"],
                "picture": picture if picture else None,
                "color": color,
                "price": product.get(f"{size}_price", None),  # Get the price for the selected size
                "size_column": size_column  # The size column name (e.g., 'XS', 'S', etc.)
            }

            return jsonify(response), 200

        elif request.method == 'GET':
            # Handle GET request to fetch all cart items and their details based on user_id
            user_id = request.args.get('user_id')

            if not user_id:
                return jsonify({"message": "user_id is required"}), 400

            # Fetch cart items
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT c.cart_id, c.product_id, c.variant_id, c.XS, c.S, c.M, c.L, c.XL, c.XLL,
                       p.product_name, p.category, p.default_picture, p.default_color,
                       p.XS_price, p.S_price, p.M_price, p.L_price, p.XL_price, p.XLL_price,
                       v.picture AS variant_picture, v.color AS variant_color,
                       v.XS_price AS var_XS_price, v.S_price AS var_S_price, 
                       v.M_price AS var_M_price, v.L_price AS var_L_price, 
                       v.XL_price AS var_XL_price, v.XLL_price AS var_XLL_price
                FROM carts c
                JOIN products p ON c.product_id = p.product_id
                LEFT JOIN variances v ON c.variant_id = v.variance_id
                WHERE c.user_id = %s
            """, (user_id,))

            cart_items = cursor.fetchall()

            # Normalize image paths for cart items
            for item in cart_items:
                if item['default_picture']:
                    item['default_picture'] = item['default_picture'].replace("\\", "/")
                if item['variant_picture']:
                    item['variant_picture'] = item['variant_picture'].replace("\\", "/")

            cursor.close()
            conn.close()

            return jsonify(cart_items), 200

    except Exception as e:
        return jsonify({"message": f"Error occurred: {str(e)}"}), 500


@users_bp.route("/api/user_profile", methods=["GET"])
def user_profile():
    try:
        user_id = request.args.get("user_id")

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT username, email_address, contact_number, created_at, profile_pic
            FROM users
            WHERE user_id = %s
            """,
            (user_id,),
        )

        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        profile_pic = normalize_profile_pic_path(user.get("profile_pic"))

        user_details = {
            "username": user["username"],
            "email_address": user["email_address"],
            "contact_number": user["contact_number"],
            "created_at": user["created_at"],
            "profile_pic": profile_pic,
        }

        cursor.close()
        conn.close()

        return jsonify(user_details), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error fetching user profile: {str(e)}"}), 500


# -------------------- User Profile --------------------




# -------------------- Login --------------------


@users_bp.route("/api/user_login", methods=["POST"])
def login_user():
    try:
        data = request.get_json() or {}
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"message": "Username and password are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user or password != user["password"]:
            cursor.close()
            conn.close()
            return jsonify({"message": "Invalid credentials"}), 401

        user_details = {
            "user_id": user["user_id"],
            "username": user["username"],
        }

        cursor.close()
        conn.close()

        return jsonify({"message": "Login successful", "user": user_details}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error logging in: {str(e)}"}), 500

# -------------------- Update Profile Picture --------------------


@users_bp.route("/api/update_profile_pic", methods=["POST"])
def update_profile_pic():
    try:
        user_id = request.form.get("user_id")
        file = request.files.get("profile_pic")

        if not file or not allowed_file(file.filename):
            return jsonify({"message": "Invalid file type or no file provided"}), 400

        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # Store a clean web path
        file_url = f"/static/uploads/{filename}"

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"message": "User not found"}), 404

        cursor.execute(
            "UPDATE users SET profile_pic = %s WHERE user_id = %s",
            (file_url, user_id),
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify(
            {"message": "Profile picture updated successfully", "profile_pic": file_url}
        ), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error updating profile picture: {str(e)}"}), 500
