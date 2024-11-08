#!/bin/sh

cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = {
  FM_KEY: '${VUE_APP_FM_KEY}'
};
EOF

nginx -g 'daemon off;'
