'use client';

const DisplayVideo = ({ src, type = 'video/mp4' }) => {


  return (
    <div className="relative w-full max-w-[800px] aspect-video mx-auto bg-black">
         <video
           src={src}
           controls
           className="absolute top-0 left-0 w-full h-full object-cover"
           playsInline
         />
       </div>
  );
};

export default DisplayVideo;
