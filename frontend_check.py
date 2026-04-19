import subprocess
import time
from playwright.sync_api import sync_playwright

def main():
    # Start the server
    server_process = subprocess.Popen(
        ['/home/jules/.nvm/versions/node/v22.22.1/bin/pnpm', 'dev'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={'ADMIN_USERNAME': 'admin', 'ADMIN_PASSWORD': 'password', 'PATH': '/home/jules/.nvm/versions/node/v22.22.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'}
    )

    try:
        # Wait for server to be ready
        print("Waiting for server to start...")
        time.sleep(10)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Login
            page.goto('http://localhost:3000')
            page.fill('input[type="text"]', 'admin')
            page.fill('input[type="password"]', 'password')
            page.click('button:has-text("Sign In")')

            # Wait for navigation
            time.sleep(2)

            # Go to Invoices page
            page.goto('http://localhost:3000/invoices')

            # Wait for data to load
            time.sleep(5)

            # Take screenshot of the top
            page.screenshot(path='invoices_page_top.png')
            print("Screenshot saved to invoices_page_top.png")

            # Use mouse wheel to scroll instead of window.scrollTo
            page.mouse.wheel(0, 10000)
            time.sleep(1)

            page.screenshot(path='invoices_page_bottom3.png')
            print("Screenshot saved to invoices_page_bottom3.png")
            browser.close()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server_process.terminate()

if __name__ == "__main__":
    main()
