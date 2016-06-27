mkdir -p timelapse
watch -n1 "scrot 'timelapse/%s-scrot.jpg' -q 50 -t 65%; rm timelapse/*scrot.jpg"
