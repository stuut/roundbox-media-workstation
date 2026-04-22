// Get animated properties for individual text lines



// Check if there are character-based animations
     const hasCharAnim = element.animations?.some(a =>
       a.type.includes('Characters') && currentTime >= a.startTime && currentTime <= a.startTime + a.duration
     );

     // Check if there are line-based animations
     const hasLineAnim = element.animations?.some(a =>
       a.type.includes('Lines') && currentTime >= a.startTime && currentTime <= a.startTime + a.duration
     );


     const charAnimProps = getCharAnimatedProps(element, charIndex, fullText.length);












  const getLineAnimatedProps = useCallback((element, lineIndex, totalLines) => {
    let props = { x: 0, y: 0, opacity: 1 };

    element.animations?.forEach(anim => {
      if (!anim.type.includes('Lines')) return;
      if (currentTime < anim.startTime) {
        // Set initial state before animation starts
        if (anim.type === 'fadeInUpLines' || anim.type === 'fadeInLines') {
          props.opacity = 0;
        }
        if (anim.type === 'fadeInUpLines') {
          props.y = 20;
        }
        if (anim.type === 'slideInLeftLines') {
          props.x = -100;
          props.opacity = 0;
        }
        if (anim.type === 'slideInRightLines') {
          props.x = 100;
          props.opacity = 0;
        }
        return;
      }

      const staggerDelay = 0.1; // Delay between each line
      const lineStartTime = anim.startTime + (lineIndex * staggerDelay);
      const lineEndTime = lineStartTime + anim.duration;



      // Animation in progress for this line
      const progress = (currentTime - lineStartTime) / anim.duration;
      const eased = easeInOutCubic(progress);

      switch (anim.type) {
        case 'fadeInUpLines':
          props.opacity = eased;
          props.y = 20 * (1 - eased);
          break;
        case 'fadeInLines':
          props.opacity = eased;
          break;
        case 'slideInLeftLines':
          props.opacity = eased;
          props.x = -100 * (1 - eased);
          break;
        case 'slideInRightLines':
          props.opacity = eased;
          props.x = 100 * (1 - eased);
          break;
      }
    });

    return props;
  }, [currentTime]);

  // Get animated properties for individual characters
  const getCharAnimatedProps = useCallback((element, charIndex, totalChars) => {
    let props = { x: 0, y: 0, opacity: 1, scale: 1 };

    element.animations?.forEach(anim => {
      if (!anim.type.includes('Characters')) return;
      if (currentTime < anim.startTime) {
   // Set initial state before animation starts
       if (anim.type === 'fadeInCharacters' || anim.type === 'fadeInUpCharacters') {
         props.opacity = 0;
       }
       if (anim.type === 'fadeInUpCharacters') {
         props.y = 10;
       }
       if (anim.type === 'slideInLeftCharacters') {
         props.x = -20;
         props.opacity = 0;
       }
       if (anim.type === 'slideInRightCharacters') {
         props.x = 20;
         props.opacity = 0;
       }
       if (anim.type === 'scaleInCharacters') {
         props.scale = 0;
         props.opacity = 0;
       }
       return;
     }

      const staggerDelay = 0.03; // Delay between each character
      const charStartTime = anim.startTime + (charIndex * staggerDelay);
      const charEndTime = charStartTime + anim.duration;

      if (currentTime < charStartTime) {
        // Set initial state before animation starts
        if (anim.type === 'fadeInCharacters' || anim.type === 'fadeInUpCharacters') {
          props.opacity = 0;
        }
        if (anim.type === 'fadeInUpCharacters') {
          props.y = 10;
        }
        if (anim.type === 'slideInLeftCharacters') {
          props.x = -20;
          props.opacity = 0;
        }
        if (anim.type === 'slideInRightCharacters') {
          props.x = 20;
          props.opacity = 0;
        }
        if (anim.type === 'scaleInCharacters') {
          props.scale = 0;
          props.opacity = 0;
        }
        return;
      }

      if (currentTime > charEndTime) {
        // Animation complete for this character
        return;
      }

      // Animation in progress for this character
      const progress = (currentTime - charStartTime) / anim.duration;
      const eased = easeInOutCubic(progress);

      switch (anim.type) {
        case 'fadeInCharacters':
          props.opacity = eased;
          break;
        case 'fadeInUpCharacters':
          props.opacity = eased;
          props.y = 10 * (1 - eased);
          break;
        case 'slideInLeftCharacters':
          props.opacity = eased;
          props.x = -20 * (1 - eased);
          break;
        case 'slideInRightCharacters':
          props.opacity = eased;
          props.x = 20 * (1 - eased);
          break;
        case 'scaleInCharacters':
          props.opacity = eased;
          props.scale = eased;
          break;
      }
    });

    return props;
  }, [currentTime]);
