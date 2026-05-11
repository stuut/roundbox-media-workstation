Image post:

curl -X POST "https://graph.instagram.com/v22.0/{user_id}/media" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://your-cdn.com/photo.jpg",
    "caption": "Check out this view! #travel"
  }'
Reel (video):

curl -X POST "https://graph.instagram.com/v22.0/{user_id}/media" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://your-cdn.com/video.mp4",
    "caption": "Behind the scenes 🎬",
    "media_type": "REELS",
    "cover_url": "https://your-cdn.com/thumbnail.jpg"
  }'
Story (image):

curl -X POST "https://graph.instagram.com/v22.0/{user_id}/media" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://your-cdn.com/story-photo.jpg",
    "media_type": "STORIES"
  }'
Story (video):

curl -X POST "https://graph.instagram.com/v22.0/{user_id}/media" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://your-cdn.com/story-video.mp4",
    "media_type": "STORIES"
  }'
Response (same for all):

{
  "id": "17889615691921648"
}
