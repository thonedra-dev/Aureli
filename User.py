# path: User.py

from flask import Blueprint, jsonify, request
from flask_cors import CORS
import mysql.connector
import traceback
import os
import uuid
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
    
# ... (Your existing code: Imports, UPLOAD_FOLDER, allowed_file, get_db_connection, etc.)

# -------------------- Submit Comment --------------------

@users_bp.route('/api/submit_comment', methods=['POST'])
def submit_comment():
    try:
        # Switch to form-data handling for image upload
        user_id = request.form.get('user_id')
        product_id = request.form.get('product_id')
        text = request.form.get('text')
        weight = request.form.get('weight')
        height = request.form.get('height')
        S = request.form.get('S', 0)
        M = request.form.get('M', 0)
        L = request.form.get('L', 0)
        XL = request.form.get('XL', 0)
        XLL = request.form.get('XLL', 0)
        small = request.form.get('small', 0)
        true_to_size = request.form.get('true_to_size', 0)
        large = request.form.get('large', 0)
        rating = request.form.get('rating', 0)

        # Handle file upload - SAVE TO DISK instead of reading binary
        file = request.files.get('comment_pic')
        comment_pic_path = None
        
        if file and file.filename:
            # Create uploads directory if it doesn't exist
            upload_folder = 'static/uploads'
            os.makedirs(upload_folder, exist_ok=True)
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(upload_folder, unique_filename)
            
            # Save file to disk
            file.save(file_path)
            comment_pic_path = file_path  # Store the path, not the binary data

        if not user_id or not product_id or not text:
            return jsonify({"message": "User ID, Product ID, and Comment Text are required"}), 400

        print(f"Data received: user_id={user_id}, product_id={product_id}, text={text}")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(''' 
            INSERT INTO comments 
            (user_id, product_id, text, weight, height, S, M, L, XL, XLL, small, true_to_size, large, rating, comment_pic, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ''', (user_id, product_id, text, weight, height, S, M, L, XL, XLL, small, true_to_size, large, rating, comment_pic_path))  # Store path instead of binary

        conn.commit()
        comment_id = cursor.lastrowid

        print(f"Comment inserted with ID: {comment_id}")

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Comment submitted successfully!",
            "comment_id": comment_id
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error submitting comment: {str(e)}"}), 500

@users_bp.route('/api/product_comments/<int:product_id>', methods=['GET'])
def fetch_product_comments(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(''' 
            SELECT comment_id, user_id, text, weight, height,
                   S, M, L, XL, XLL,
                   small, true_to_size, large,
                   rating, comment_pic, created_at
            FROM comments
            WHERE product_id = %s
            ORDER BY created_at DESC
        ''', (product_id,))
        comments = cursor.fetchall()

        for c in comments:
            # --- size label from binary columns ---
            c['size_label'] = next((k for k in ["S", "M", "L", "XL", "XLL"] if c.get(k) == 1), "N/A")

            # --- fit label from binary columns ---
            if c.get('small') == 1:
                c['fit_label'] = "Small"
            elif c.get('true_to_size') == 1:
                c['fit_label'] = "True to Size"
            elif c.get('large') == 1:
                c['fit_label'] = "Large"
            else:
                c['fit_label'] = "N/A"

        cursor.close()
        conn.close()

        return jsonify({"comments": comments}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching comments: {str(e)}"}), 500

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

        # Fetch variants with shop_id from products table
        cursor.execute(''' 
            SELECT v.variance_id, v.product_id, v.color, v.picture,
                   v.XS, v.S, v.M, v.L, v.XL, v.XLL,
                   v.XS_price, v.S_price, v.M_price, v.L_price, v.XL_price, v.XLL_price,
                   v.XS_stock, v.S_stock, v.M_stock, v.L_stock, v.XL_stock, v.XLL_stock,
                   p.shop_id
            FROM variances v
            JOIN products p ON v.product_id = p.product_id
            WHERE v.product_id = %s
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

@users_bp.route('/api/user_visiting_shop_profile', methods=['POST'])
def user_visiting_shop_profile():
    try:
        # Extract only shop_id from the request body
        data = request.get_json()
        shop_id = data.get('shop_id')

        if not shop_id:
            return jsonify({"message": "Shop ID is required"}), 400

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to fetch shop profile details based on the shop_id
        query = '''
            SELECT id, shop_name, profile_pic, category, country, state, shop_email, description, contact_number
            FROM shops
            WHERE id = %s
        '''
        cursor.execute(query, (shop_id,))
        shop = cursor.fetchone()

        # Check if the shop is found
        if shop:
            shop_data = {
                "id": shop[0],
                "shop_name": shop[1],
                "profile_pic": shop[2],  # File path for profile_pic
                "category": shop[3],
                "country": shop[4],
                "state": shop[5],
                "shop_email": shop[6],
                "description": shop[7],
                "contact_number": shop[8]
            }
            return jsonify(shop_data), 200
        else:
            return jsonify({"message": "Shop not found"}), 404

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching shop profile: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@users_bp.route('/api/user_visiting_shop_profile_cards', methods=['POST'])
def user_visiting_shop_profile_cards():
    try:
        # Extract only shop_id from the request body
        data = request.get_json()
        shop_id = data.get('shop_id')

        if not shop_id:
            return jsonify({"message": "Shop ID is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(''' 
            SELECT product_id, product_name, XS, S, M, L, XL, XLL, XS_price, S_price, M_price, L_price, XL_price, XLL_price, 
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock, default_picture
            FROM products
            WHERE shop_id = %s AND is_active = 1
        ''', (shop_id,))

        products = cursor.fetchall()

        # Loop through each product to calculate the default price and format the image path
        for product in products:
            # Find the smallest price among the available sizes
            price_columns = ['XS_price', 'S_price', 'M_price', 'L_price', 'XL_price', 'XLL_price']
            valid_prices = [product[col] for col in price_columns if product[col] is not None]

            if valid_prices:
                default_price = min(valid_prices)  # Select the smallest price
            else:
                default_price = None  # If no price is available, set to None

            product['default_price'] = default_price  # Add the calculated default_price to the product data

            # ✅ Just normalize the path, do NOT add http://localhost:5070
            if product['default_picture']:
                path = product['default_picture'].replace('\\', '/')
                product['default_picture'] = path  # e.g. "/static/uploads/xxx.jpg"
            else:
                product['default_picture'] = None

        cursor.close()
        conn.close()

        return jsonify(products), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching products: {str(e)}"}), 500

@users_bp.route('/api/open_chat', methods=['POST'])
def open_chat():
    try:
        # Extract user_id and shop_id from the request body
        data = request.get_json()
        user_id = data.get('user_id')
        shop_id = data.get('shop_id')

        if not user_id or not shop_id:
            return jsonify({"message": "User ID and Shop ID are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if a chat already exists between the user and the shop
        check_query = '''
            SELECT chat_id FROM chats
            WHERE (user_id = %s AND shop_id = %s)
            OR (user_id = %s AND shop_id = %s)
            LIMIT 1
        '''
        cursor.execute(check_query, (user_id, shop_id, shop_id, user_id))
        existing_chat = cursor.fetchone()

        if existing_chat:
            # If chat exists, return the existing chat_id
            return jsonify({"chat_id": existing_chat['chat_id']}), 200

        # If no chat exists, create a new chat
        insert_query = '''
            INSERT INTO chats (user_id, shop_id)
            VALUES (%s, %s)
        '''
        cursor.execute(insert_query, (user_id, shop_id))
        conn.commit()

        new_chat_id = cursor.lastrowid  # Get the new chat_id
        return jsonify({"chat_id": new_chat_id}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating chat: {str(e)}"}), 500

    finally:
        # Close the connection and cursor
        if conn:
            cursor.close()
            conn.close()


@users_bp.route('/api/user-chat-rooms', methods=['GET'])
def user_chat_rooms():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
        SELECT
            c.chat_id,
            c.shop_id,
            s.shop_name,
            s.category,
            s.country,
            s.profile_pic,
            c.last_message,
            c.last_message_time,
            c.created_at
        FROM chats c
        JOIN shops s ON c.shop_id = s.id
        WHERE c.user_id = %s
        ORDER BY c.last_message_time DESC, c.created_at DESC
        """
        
        cursor.execute(query, (user_id,))
        chat_rooms = cursor.fetchall()

        return jsonify({'chat_rooms': chat_rooms, 'for_user': user_id})

    except mysql.connector.Error as err:
        return jsonify({'message': f'Error: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@users_bp.route('/api/chats', methods=['GET', 'POST'])
def view_chats():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if request.method == 'POST':
            # Handle sending new message
            data = request.get_json()
            user_id = data.get('user_id')
            chat_id = data.get('chat_id')
            message = data.get('message')
            shop_id = data.get('shop_id')

            # Only require user_id, chat_id, and shop_id for POST
            if not all([user_id, chat_id, shop_id]):
                return jsonify({"error": "user_id, chat_id, and shop_id are required"}), 400

            # If message is provided, insert it
            if message:
                insert_query = """
                    INSERT INTO messages (chat_id, sender_id, receiver_id, message)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(insert_query, (chat_id, user_id, shop_id, message))
                connection.commit()

                # Get the new message with user details
                message_query = """
                    SELECT 
                        m.id, m.message, m.sender_id, m.timestamp,
                        u.username, u.profile_pic
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.id = %s
                """
                cursor.execute(message_query, (cursor.lastrowid,))
                new_message = cursor.fetchone()

                return jsonify({'newMessage': new_message})
            else:
                # If no message, just return success (for chat creation)
                return jsonify({'message': 'Chat ready'})

        else:
            # Handle GET request - fetch messages
            user_id = request.args.get('user_id')
            shop_id = request.args.get('shop_id')
            chat_id = request.args.get('chat_id')

            if not all([user_id, shop_id, chat_id]):
                return jsonify({"error": "user_id, shop_id, and chat_id are required"}), 400

            # Fetch messages with user info
            messages_query = """
                SELECT 
                    m.id, m.message, m.sender_id, m.timestamp,
                    u.username, u.profile_pic
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_id = %s
                ORDER BY m.timestamp ASC
            """
            cursor.execute(messages_query, (chat_id,))
            messages = cursor.fetchall()

            # Fetch shop details for header
            shop_query = """
                SELECT shop_name, profile_pic, category, country
                FROM shops
                WHERE id = %s
            """
            cursor.execute(shop_query, (shop_id,))
            shop_details = cursor.fetchone()

            return jsonify({
                'messages': messages,
                'shop_details': shop_details
            })

    except mysql.connector.Error as err:
        return jsonify({'message': f'Error: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


    
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
