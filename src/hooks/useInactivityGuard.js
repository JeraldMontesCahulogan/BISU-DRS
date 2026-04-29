/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";

export function useInactivityGuard(timeoutMs = 60_000, enabled = true) {
  const timerRef = useRef(null);
  const inactiveRef = useRef(false);
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    if (!enabled) {
      clear();
      inactiveRef.current = false;
      setInactive(false);
      return;
    }

    const start = () => {
      clear();
      timerRef.current = setTimeout(() => {
        inactiveRef.current = true;
        setInactive(true);
      }, timeoutMs);
    };

    let lastMove = 0;

    const onActivity = (e) => {
      if (e.type === "mousemove") {
        const now = Date.now();
        if (now - lastMove < 250) return;
        lastMove = now;
      }

      inactiveRef.current = false;
      setInactive(false);
      start();
    };

    const events = [
      "mousedown",
      "keydown",
      "touchstart",
      "wheel",
      "pointerdown",
      "mousemove",
      "scroll",
    ];

    events.forEach((name) => {
      window.addEventListener(name, onActivity, { passive: true });
    });

    start();

    return () => {
      clear();
      events.forEach((name) => {
        window.removeEventListener(name, onActivity);
      });
    };
  }, [timeoutMs, enabled]);

  return inactive;
}

// import { useEffect, useRef, useState } from "react";

// export function useInactivityGuard(timeoutMs = 60_000, enabled = true) {
//   const timerRef = useRef(null);
//   const inactiveRef = useRef(false);
//   const [inactive, setInactive] = useState(false);

//   useEffect(() => {
//     const clear = () => {
//       if (timerRef.current) clearTimeout(timerRef.current);
//       timerRef.current = null;
//     };

//     if (!enabled) {
//       clear();
//       return;
//     }

//     const start = () => {
//       clear();
//       timerRef.current = setTimeout(() => {
//         inactiveRef.current = true;
//         setInactive(true);
//         console.log("inactive for now");
//       }, timeoutMs);
//     };

//     let lastMove = 0;

//     const onActivity = (e) => {
//       if (e.type === "mousemove") {
//         const now = Date.now();
//         if (now - lastMove < 250) return;
//         lastMove = now;
//       }

//       inactiveRef.current = false;
//       setInactive(false);
//       start();
//     };

//     const events = [
//       "mousedown",
//       "keydown",
//       "touchstart",
//       "wheel",
//       "pointerdown",
//       "mousemove",
//       "scroll",
//     ];

//     events.forEach((name) => {
//       window.addEventListener(name, onActivity, { passive: true });
//     });

//     start();

//     return () => {
//       clear();
//       events.forEach((name) => {
//         window.removeEventListener(name, onActivity);
//       });
//     };
//   }, [timeoutMs, enabled]);

//   return inactive;
// }

// import { useEffect, useRef, useState } from "react";

// export function useInactivityGuard(timeoutMs = 60_000) {
//   const timerRef = useRef(null);
//   const inactiveRef = useRef(false);
//   const [inactive, setInactive] = useState(false);

//   useEffect(() => {
//     const clear = () => {
//       if (timerRef.current) clearTimeout(timerRef.current);
//       timerRef.current = null;
//     };

//     const start = () => {
//       clear();
//       timerRef.current = setTimeout(() => {
//         inactiveRef.current = true;
//         setInactive(true);
//         console.log("inactive for now");
//       }, timeoutMs);
//     };

//     let lastMove = 0;

//     const onActivity = (e) => {
//       if (e.type === "mousemove") {
//         const now = Date.now();
//         if (now - lastMove < 250) return;
//         lastMove = now;
//       }

//       if (inactiveRef.current) {
//         console.log("active again");
//       }

//       inactiveRef.current = false;
//       setInactive(false);
//       start();
//     };

//     const events = [
//       "mousedown",
//       "keydown",
//       "touchstart",
//       "wheel",
//       "pointerdown",
//       "mousemove",
//       "scroll",
//     ];

//     events.forEach((name) => {
//       window.addEventListener(name, onActivity, { passive: true });
//     });

//     start();

//     return () => {
//       clear();
//       events.forEach((name) => {
//         window.removeEventListener(name, onActivity, { passive: true });
//       });
//     };
//   }, [timeoutMs]);

//   return inactive;
// }
