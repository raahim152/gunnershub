from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --- CONFIGURATION ---
# Replace this with your ALB DNS on viva day (or your EC2 public IP for the single-instance test)
APP_URL = "http://localhost"
# ---------------------

def run_test():
    print("🚀 Starting Selenium test for Gunners Matchday Hub...")

    options = webdriver.ChromeOptions()
    # options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)

    try:
        # 1. Open the app
        print(f"   → Opening {APP_URL}")
        driver.get(APP_URL)
        driver.maximize_window()

        # 2. Verify page title
        WebDriverWait(driver, 10).until(EC.title_contains("Gunners"))
        print(f"   ✅ Page loaded: '{driver.title}'")

        # 3. Verify fixtures are listed
        fixtures = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "fixture-card"))
        )
        assert len(fixtures) >= 3, f"Expected at least 3 fixtures, got {len(fixtures)}"
        print(f"   ✅ Found {len(fixtures)} fixtures")

        # 4. Submit a prediction on the FIRST upcoming fixture (PSG)
        # Find the first fixture card with a prediction form
        upcoming_card = None
        for card in fixtures:
            if card.find_elements(By.CLASS_NAME, "prediction-form"):
                upcoming_card = card
                break
        assert upcoming_card is not None, "No upcoming fixture with a prediction form found"
        print("   → Found upcoming fixture with prediction form")

        username_input = upcoming_card.find_element(By.NAME, "username")
        home_input = upcoming_card.find_element(By.NAME, "home_score")
        away_input = upcoming_card.find_element(By.NAME, "away_score")
        predict_btn = upcoming_card.find_element(By.XPATH, ".//button[@type='submit']")

        test_user = "SeleniumBot"
        username_input.send_keys(test_user)
        home_input.send_keys("3")
        away_input.send_keys("1")
        predict_btn.click()
        print(f"   → Submitted prediction: Arsenal 3 - 1 (by {test_user})")
        time.sleep(2)  # let the fetch complete and list refresh

        # 5. Finalize the same fixture via the Simulate Result button
        # Re-find the card (the previous one was re-rendered)
        cards = driver.find_elements(By.CLASS_NAME, "fixture-card")
        upcoming_card = None
        for card in cards:
            if card.find_elements(By.CLASS_NAME, "btn-admin"):
                upcoming_card = card
                break
        assert upcoming_card is not None, "No upcoming fixture to finalize"

        simulate_btn = upcoming_card.find_element(By.CLASS_NAME, "btn-admin")
        # Accept the JS confirm() dialog
        driver.execute_script("window.confirm = () => true;")
        simulate_btn.click()
        print("   → Clicked Simulate Result (dialog auto-accepted)")

        # Wait for the result banner or FT badge to appear
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "result-banner"))
        )
        print("   ✅ Result banner appeared")
        time.sleep(3)  # let the banner fade and fixtures refresh

        # 6. Switch to Leaderboard tab
        leaderboard_tab = driver.find_element(By.XPATH, "//button[contains(text(), 'Leaderboard')]")
        leaderboard_tab.click()
        print("   → Switched to Leaderboard tab")

        # 7. Verify SeleniumBot appears in the leaderboard
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "leaderboard-table"))
        )
        time.sleep(1)  # give the fetch a moment
        tbody = driver.find_element(By.CSS_SELECTOR, "#leaderboard-table tbody")
        leaderboard_text = tbody.text

        assert test_user in leaderboard_text, f"'{test_user}' not found in leaderboard"
        print(f"   ✅ '{test_user}' appears in the leaderboard")

        # Find the row containing SeleniumBot and print the row
        for row in tbody.find_elements(By.TAG_NAME, "tr"):
            if test_user in row.text:
                print(f"   📊 Leaderboard row: {row.text}")
                break

        print("\n🎉 ALL TESTS PASSED — full flow verified end-to-end.")
        time.sleep(4)  # keep browser open so you can screenshot

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        time.sleep(5)

    finally:
        driver.quit()
        print("🔒 Browser closed.")

if __name__ == "__main__":
    run_test()