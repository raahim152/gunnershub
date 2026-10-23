from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --- CONFIGURATION ---
# Replace this with your EC2 public IP (or later, your Load Balancer DNS)
APP_URL = "http://32.199.162.213"
# ---------------------

def run_test():
    print("Starting Selenium Test for Gunners Hub...")
    
    # Launch Chrome
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless")  # Uncomment to run without opening a window
    driver = webdriver.Chrome(options=options)
    
    try:
        # 1. Open the application
        print(f"   → Opening {APP_URL}")
        driver.get(APP_URL)
        driver.maximize_window()
        
        # 2. Verify the page title
        WebDriverWait(driver, 10).until(EC.title_contains("Gunners"))
        print(f"   Title verified: '{driver.title}'")
        
        # 3. Verify the main heading exists
        heading = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert "Gunners Matchday Hub" in heading.text
        print(f"   Main heading found: '{heading.text}'")
        
        # 4. Verify the form inputs exist
        username_input = driver.find_element(By.ID, "username")
        prediction_input = driver.find_element(By.ID, "prediction")
        submit_button = driver.find_element(By.TAG_NAME, "button")
        print("   Form elements (username, prediction, submit) found")
        
        # 5. Fill in the form and submit a test prediction
        test_user = "SeleniumBot"
        test_pred = "Arsenal 5 - 0 Chelsea"
        username_input.send_keys(test_user)
        prediction_input.send_keys(test_pred)
        submit_button.click()
        print(f"   → Submitted prediction: '{test_pred}' by '{test_user}'")
        
        # 6. Wait for the prediction to appear in the list
        time.sleep(2)  # Give the backend time to save and re-fetch
        predictions_list = driver.find_element(By.ID, "prediction-list")
        assert test_pred in predictions_list.text, "Prediction was not displayed!"
        print(f"   Prediction successfully displayed in the list")
        
        print("\n  ALL TESTS PASSED! Application is working correctly.")
        
    except Exception as e:
        print(f"\n  TEST FAILED: {e}")
        
    finally:
        time.sleep(20)  # Keep the browser open for 10 seconds so you can see the result
        driver.quit()
        print(" Browser closed.")

if __name__ == "__main__":
    run_test()