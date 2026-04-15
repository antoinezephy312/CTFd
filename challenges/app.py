from flask import Flask, render_template_string

app = Flask(__name__)

CHALLENGE_INFO = {
    "8001": {
        "name": "Web Easy 1 - Login Bypass 101",
        "description": "Find a SQL injection in login and recover admin access.",
        "hint": "Try entering a single quote in the username field"
    },
    "8002": {
        "name": "Web Easy 2 - XSS Starter",
        "description": "Trigger reflected XSS to steal a mock session token.",
        "hint": "Check the URL parameters"
    },
    "8003": {
        "name": "Web Easy 3 - IDOR Intro",
        "description": "Abuse insecure object references to read restricted data.",
        "hint": "Try modifying the ID in the URL"
    },
    "8004": {
        "name": "Web Medium 1 - JWT None Confusion",
        "description": "Exploit improper JWT signature verification.",
        "hint": "Check the JWT header"
    },
    "8005": {
        "name": "Web Medium 2 - SSRF Metadata Crawl",
        "description": "Use SSRF to query internal metadata and recover secrets.",
        "hint": "Try accessing internal URLs"
    },
    "8006": {
        "name": "Web Medium 3 - Upload Polyglot",
        "description": "Bypass upload validation and execute a payload.",
        "hint": "Try polyglot file types"
    }
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>{{ challenge_name }}</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .challenge-box { background: #2a2a2a; padding: 20px; border-radius: 5px; }
        h1 { color: #00ff00; }
        .hint { background: #333; padding: 10px; margin-top: 20px; border-left: 3px solid #00ff00; }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{ challenge_name }}</h1>
        <div class="challenge-box">
            <p><strong>Description:</strong> {{ description }}</p>
            <div class="hint">
                <strong>Hint:</strong> {{ hint }}
            </div>
            <p style="margin-top: 20px; color: #888;">Challenge container is running. Start your exploitation!</p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    port = app.config.get('PORT', '5000')
    challenge = CHALLENGE_INFO.get(port, {
        "name": "Unknown Challenge",
        "description": "Challenge details not found",
        "hint": "Check the port configuration"
    })

    return render_template_string(
        HTML_TEMPLATE,
        challenge_name=challenge["name"],
        description=challenge["description"],
        hint=challenge["hint"]
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
