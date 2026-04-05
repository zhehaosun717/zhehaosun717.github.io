from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:4000')

    # Wait for the loader to disappear
    page.wait_for_selector('.loader.loaded', state='attached', timeout=10000)

    # Check contact form labels
    name_label = page.locator('label[for="contact-name"]')
    email_label = page.locator('label[for="contact-email"]')
    msg_label = page.locator('label[for="contact-message"]')
    assert name_label.count() == 1, "Missing contact-name label"
    assert email_label.count() == 1, "Missing contact-email label"
    assert msg_label.count() == 1, "Missing contact-message label"
    print("✓ Contact form labels verified")

    # Check project cards
    card_headers = page.locator('.project-card-header')
    count = card_headers.count()
    assert count > 0, "No project cards found"

    first_header = card_headers.first
    assert first_header.get_attribute('tabindex') == '0', "Missing tabindex"
    assert first_header.get_attribute('role') == 'button', "Missing role"
    assert first_header.get_attribute('aria-expanded') == 'false', "Initial aria-expanded is not false"
    print("✓ Project card attributes verified")

    # Test keyboard navigation
    first_header.focus()
    # verify the focus outline
    box_shadow = first_header.evaluate('el => window.getComputedStyle(el).outline')
    # we just make sure there is some outline, since the actual rgb might vary
    assert box_shadow != 'none', "Focus outline missing"

    first_header.press('Enter')
    assert first_header.get_attribute('aria-expanded') == 'true', "aria-expanded didn't change to true on Enter"

    print("✓ Project card keyboard interaction verified")

    browser.close()
