# Builds both targets from gen.js + ui.html:
#   quadrille.html      -> the Claude page (shared store = Claude db capability)
#   app/www/index.html  -> the Android/iOS app (shared store = Supabase, fonts bundled offline)
import os, re, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(ROOT, *a)

gen = open(p('gen.js')).read()
gen = gen[gen.index('/*GEN-START*/'):gen.index('/*GEN-END*/') + len('/*GEN-END*/')]
ui = open(p('ui.html')).read().replace('__GEN__', gen)

open(p('quadrille.html'), 'w').write(ui)

# ----- app -----
body = re.sub(r'<link rel="preconnect"[^>]*>\n', '', ui)
body = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>', '<link rel="stylesheet" href="fonts/fonts.css">', body)
title = re.search(r'<title>.*?</title>', body).group(0)
body = body.replace(title + '\n', '', 1)
head = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#E8ECF2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D101A" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Quadrille">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" href="icons/icon-192.png">
{title}
<style>
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}}
img{{max-width:100%}}
[hidden]{{display:none!important}}
.safe-top{{position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:30}}
</style>
<script src="vendor/supabase.js"></script>
<script src="config.js"></script>
<script src="backend.js"></script>
<script>if('serviceWorker' in navigator&&!window.Capacitor&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}));</script>
</head>
<body>
<div class="safe-top"></div>
'''
www = p('app', 'www')
os.makedirs(www, exist_ok=True)
open(os.path.join(www, 'index.html'), 'w').write(head + body + '\n</body>\n</html>\n')
for f in ('backend.js', 'config.js'):
    shutil.copy(p('app', 'src', f), os.path.join(www, f))
# Web-app extras (home-screen install, offline cache) for the hosted version.
shutil.copytree(p('app', 'src', 'web'), www, dirs_exist_ok=True)
print('built quadrille.html and app/www/index.html')
