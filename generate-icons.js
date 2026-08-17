import fs from 'fs';
import path from 'path';

// Simplistic 1x1 transparent PNG base64, we'll just write it and let it be an empty icon if canvas isn't available.
// Actually, let's just use SVG for the icons, it is supported by Android.
