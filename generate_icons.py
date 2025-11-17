#!/usr/bin/env python3
"""
Generate PNG icons from SVG for Chrome Extension
Requires: pip install Pillow cairosvg
"""

import os
from pathlib import Path

def create_simple_png_icons():
    """Create simple PNG icons using PIL"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        icons_dir = Path(__file__).parent / "icons"
        sizes = [16, 48, 128]
        
        for size in sizes:
            # Create a new image with gradient-like background
            img = Image.new('RGB', (size, size), color='#667eea')
            draw = ImageDraw.Draw(img)
            
            # Draw a simple clock/chart representation
            # Background gradient effect (simplified)
            for i in range(size):
                color_val = int(102 + (118 - 102) * (i / size))  # Gradient from #667eea to #764ba2
                draw.line([(0, i), (size, i)], fill=(color_val, 126, 234))
            
            # Draw a simple clock circle
            circle_size = int(size * 0.5)
            circle_pos = (size // 2 - circle_size // 2, size // 4 - circle_size // 2)
            draw.ellipse(
                [circle_pos[0], circle_pos[1], 
                 circle_pos[0] + circle_size, circle_pos[1] + circle_size],
                fill='white',
                outline='white'
            )
            
            # Draw clock hands
            center_x = size // 2
            center_y = size // 4
            hand_length = circle_size // 3
            draw.line([(center_x, center_y), (center_x, center_y - hand_length)], 
                     fill='#667eea', width=max(1, size // 32))
            draw.line([(center_x, center_y), (center_x + hand_length, center_y)], 
                     fill='#667eea', width=max(1, size // 32))
            
            # Draw simple bar chart at bottom
            bar_height_base = size // 4
            bar_width = size // 8
            bar_spacing = size // 16
            
            for idx, height_mult in enumerate([0.4, 0.7, 0.9]):
                bar_height = int(bar_height_base * height_mult)
                x_pos = bar_spacing + idx * (bar_width + bar_spacing)
                y_pos = size - bar_spacing - bar_height
                
                draw.rectangle(
                    [x_pos, y_pos, x_pos + bar_width, size - bar_spacing],
                    fill='white',
                    outline='white'
                )
            
            # Save the icon
            output_path = icons_dir / f"icon{size}.png"
            img.save(output_path, 'PNG')
            print(f"✓ Created {output_path}")
            
        print("\n✅ All icons generated successfully!")
        return True
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("\nTo generate icons, install required packages:")
        print("  pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Error generating icons: {e}")
        return False

if __name__ == "__main__":
    print("🎨 Generating Chrome Extension icons...\n")
    create_simple_png_icons()
