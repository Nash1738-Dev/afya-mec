import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# --- LOCAL SCANNER SETTINGS ---
EXCLUDE_DIRS = {'node_modules', '.git', '__pycache__', 'venv', 'env', 'dist', 'build'}
TARGET_EXTENSIONS = ('.py', '.jsx', '.js')
KEY_FILES_TO_READ = {'models.py', 'schemas.py', 'main.py', 'App.jsx', 'Layout.jsx'}

def local_scan(root_dir, report):
    report.append("=== PART 1: LOCAL CODEBASE ARCHITECTURE ===\n")
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in KEY_FILES_TO_READ or ('pages' in root and f.endswith('.jsx')):
                file_path = os.path.join(root, f)
                report.append(f"\n{'='*60}\nFILE: {os.path.relpath(file_path, root_dir)}\n{'='*60}\n")
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        report.append(file.read())
                except Exception as e:
                    report.append(f"[Error reading file: {e}]")

def web_scrape(live_url, username, pin, report):
    report.append("\n\n=== PART 2: LIVE WEB SCRAPER (UI EXTRACTION) ===\n")
    
    # Setup invisible Chrome browser
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') # Runs in background without popping up a window
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    
    try:
        driver = webdriver.Chrome(options=options)
        print("🌐 Connecting to live site...")
        driver.get(live_url)
        
        # Wait for login page to load and find inputs
        wait = WebDriverWait(driver, 10)
        
        # We assume your inputs have 'name' or 'type' attributes we can target
        print("🔑 Attempting to log in...")
        name_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='text' or contains(@name, 'name')]")))
        pin_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'pin')]")
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Login') or contains(text(), 'Sign')]")
        
        name_input.send_keys(username)
        pin_input.send_keys(pin)
        submit_btn.click()
        
        # Wait for Dashboard to load (waiting for a nav element or main container)
        time.sleep(5) # Pause to let React render the dashboard
        
        print("📄 Scraping live dashboard UI...")
        # Grab all the visible text on the dashboard
        body_text = driver.find_element(By.TAG_NAME, "body").text
        report.append("--- LIVE DASHBOARD TEXT CAPTURE ---\n")
        report.append(body_text)
        
        # Grab all navigation links/buttons available to this user
        report.append("\n--- AVAILABLE MENU OPTIONS ---\n")
        buttons = driver.find_elements(By.TAG_NAME, "button")
        links = driver.find_elements(By.TAG_NAME, "a")
        for btn in buttons:
            if btn.text.strip(): report.append(f"[Button]: {btn.text}")
        for link in links:
            if link.text.strip(): report.append(f"[Link]: {link.text}")

        driver.quit()
        print("✅ Web scraping complete!")

    except TimeoutException:
        report.append("\n[Web Scraper Error: Could not find login fields. The bot might need exact CSS classes to 'see' the inputs.]")
        print("⚠️ Web scraper timed out looking for elements.")
    except Exception as e:
        report.append(f"\n[Web Scraper Error: {e}]")
        print(f"⚠️ Web scraper hit an error: {e}")

def run_ultimate_scanner(root_dir, live_url, username, pin):
    report = []
    print("Starting Ultimate Scan...")
    
    # 1. Run Local Scan
    print("📂 Scanning local project files...")
    local_scan(root_dir, report)
    
    # 2. Run Web Scrape
    web_scrape(live_url, username, pin, report)
    
    # Save Report
    output_file = "afyamec_ultimate_report.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(report))
    
    print(f"\n🎉 DONE! Ultimate report saved to: {output_file}")

if __name__ == "__main__":
    # --- CHANGE THESE TO YOUR ACTUAL LIVE LOGIN INFO ---
    LIVE_URL = "https://jellyfish-app-7kmt9.ondigitalocean.app/"
    USERNAME = "Admin" 
    PIN = "1234"      
    # ---------------------------------------------------
    
    current_directory = os.path.dirname(os.path.abspath(__file__))
    run_ultimate_scanner(current_directory, LIVE_URL, USERNAME, PIN)