from flask import Flask, render_template, request, jsonify
from dns_logic import resolve_domain

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/resolve", methods=["POST"])
def resolve():

    data = request.get_json()

    domain = data.get("domain", "").strip().lower()

    result = resolve_domain(domain)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)