#!/usr/bin/env python3
"""
Script to fix the cloned Joyology site for local development.
- Converts absolute URLs to relative
- Adds Bootstrap JS
- Replaces dynamic headless navigation with static version
- Fixes CSS loading
"""

import os
import re
from pathlib import Path

# Static navigation bar HTML to replace the dynamic range-headless element
STATIC_NAV_BAR = '''
<div class="joyology-headless-nav-static" style="background: #285066; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <a href="/locations/" style="color: #e1f651; font-weight: 600; text-decoration: none; font-size: 14px;">
            <i class="fas fa-map-marker-alt"></i> Find a Location
        </a>
        <span style="color: white; font-size: 14px;">|</span>
        <a href="/location/lake-orion/" style="color: white; text-decoration: none; font-size: 14px;">Lake Orion</a>
        <a href="/location/monroe/" style="color: white; text-decoration: none; font-size: 14px;">Monroe</a>
        <a href="/location/centerline-sherwood/" style="color: white; text-decoration: none; font-size: 14px;">Centerline</a>
        <a href="/location/mt-clemens-malow/" style="color: white; text-decoration: none; font-size: 14px;">Mt. Clemens</a>
    </div>
    <div style="display: flex; gap: 15px; align-items: center;">
        <a href="/daily-deals/" class="btn btn-primary btn-sm" style="background: #e1f651; color: #285066; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 14px;">
            View Deals
        </a>
        <a href="/shop/" class="btn btn-sm" style="background: white; color: #285066; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 14px;">
            Shop Menu
        </a>
    </div>
</div>
'''

# Additional CSS fixes
ADDITIONAL_CSS = '''
<style>
/* Local development fixes */
.headless-nav-placeholder { display: none !important; }
.range-headless { display: none !important; }

/* Make navigation dropdowns work */
.dropdown:hover .dropdown-menu {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* Fix the header positioning */
.header-default {
    position: relative !important;
}

/* Ensure images load */
img {
    max-width: 100%;
    height: auto;
}

/* Fix gradient background */
body.page, body.page-template {
    background: linear-gradient(180deg, #ee4405 0%, #f14fab 50%, #f25e88 80%, #f25e88 100%) !important;
    min-height: 100vh;
}

/* Static nav bar styling */
.joyology-headless-nav-static {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
}

/* Ensure body has padding for fixed nav */
body {
    padding-bottom: 60px;
}
</style>
'''

# Scripts to add before closing body tag
SCRIPTS_TO_ADD = '''
<script src="/js/jquery.min.js"></script>
<script src="/js/bootstrap.bundle.min.js"></script>
<script src="/js/gsap.min.js"></script>
<script>
// Initialize Bootstrap dropdowns
document.addEventListener('DOMContentLoaded', function() {
    // Enable all dropdowns
    var dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(function(dropdown) {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            var menu = this.nextElementSibling;
            if (menu && menu.classList.contains('dropdown-menu')) {
                menu.classList.toggle('show');
            }
        });
    });
});
</script>
'''

def fix_html_file(filepath):
    """Fix a single HTML file."""
    print(f"Fixing: {filepath}")

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original_content = content

    # 1. Convert absolute URLs to relative
    content = content.replace('https://joyology.com/', '/')
    content = content.replace('http://joyology.com/', '/')

    # 2. Fix asset paths - remove domain from src/href
    content = re.sub(r'(src|href)="https?://joyology\.com(/[^"]*)"', r'\1="\2"', content)

    # 3. Replace the dynamic range-headless navigation placeholder
    # Find and replace the headless nav container
    content = re.sub(
        r'<div id="range-headless-root-\d+"[^>]*>.*?</div>\s*</div>',
        STATIC_NAV_BAR + '</div>',
        content,
        flags=re.DOTALL
    )

    # 4. Add additional CSS before </head>
    if ADDITIONAL_CSS not in content:
        content = content.replace('</head>', ADDITIONAL_CSS + '\n</head>')

    # 5. Remove external scripts that won't work locally
    content = re.sub(r'<script[^>]*googletagmanager[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script[^>]*gtag[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script[^>]*surfside[^>]*>.*?</script>', '', content, flags=re.DOTALL)

    # 6. Add local scripts before </body>
    if '/js/bootstrap.bundle.min.js' not in content:
        content = content.replace('</body>', SCRIPTS_TO_ADD + '\n</body>')

    # 7. Fix CSS loading - change from print to all media
    content = re.sub(r'media="print"([^>]*onload="[^"]*")', r'media="all"\1', content)

    # 8. Add body class if missing
    if '<body>' in content and 'class=' not in content.split('<body')[1].split('>')[0]:
        content = content.replace('<body>', '<body class="page page-template">')

    # Only write if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Updated: {filepath}")
    else:
        print(f"  No changes: {filepath}")

def main():
    """Fix all HTML files in the site."""
    site_dir = Path('/Users/alexcarlson/Documents/Projects/joyology-dev/joyology.com')

    # Find all HTML files
    html_files = list(site_dir.rglob('*.html'))

    print(f"Found {len(html_files)} HTML files to process\n")

    for html_file in html_files:
        fix_html_file(html_file)

    print(f"\nDone! Fixed {len(html_files)} files.")
    print("Refresh http://localhost:8080 to see the changes.")

if __name__ == '__main__':
    main()
