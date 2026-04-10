import sys
from playwright.sync_api import sync_playwright

def test_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:4000')

        # Hide loader
        page.add_style_tag(content='#loader { display: none !important; }')

        # Wait for project card header to be in DOM
        header = page.locator('#project-unreal .project-card-header')
        header.wait_for(state='attached')

        # Check attributes
        assert header.get_attribute('role') == 'button'
        assert header.get_attribute('tabindex') == '0'
        assert header.get_attribute('aria-expanded') == 'false'

        # Focus header and trigger Space
        header.focus()
        page.keyboard.press('Space')

        # Check aria-expanded changed to true
        page.wait_for_function('document.querySelector("#project-unreal .project-card-header").getAttribute("aria-expanded") === "true"')
        assert header.get_attribute('aria-expanded') == 'true'

        # Trigger Enter
        page.keyboard.press('Enter')

        # Check aria-expanded changed back to false
        page.wait_for_function('document.querySelector("#project-unreal .project-card-header").getAttribute("aria-expanded") === "false"')
        assert header.get_attribute('aria-expanded') == 'false'

        print("Accessibility tests passed successfully.")
        browser.close()

if __name__ == '__main__':
    test_a11y()
