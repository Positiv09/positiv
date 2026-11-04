/* Fit quiz pop-up (Figma: "Fit quiz — 1 Industry" … "Fit quiz — Result (sent, answers open)").
   Opens from the "Book a call" button in the Expertise menu card ("Are you the right fit?"), from any element with
   [data-fit-quiz], and from a URL ending in #fit-quiz. Single-answer questions move on by themselves; the challenges
   question takes up to 3 answers (or "I'm not sure yet" on its own) and has a Continue button.
   The result is written from every answer (headline per challenge mix, paragraph per industry/ecosystem and help,
   reply line per timing). The lead goes to the same FormSubmit address as the contact pop-up, with its own
   one-per-hour guard so the full contact form still works afterwards. */
(() => {
  const ENDPOINT = 'https://formsubmit.co/ajax/tikarirafik@gmail.com';
  const COOLDOWN = 60 * 60 * 1000;
  const KEY = 'positivQuizSentAt';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Phosphor Icons, regular weight (phosphoricons.com) */
  const ICON = {"handshake":"M254.3,107.91,228.78,56.85a16,16,0,0,0-21.47-7.15L182.44,62.13,130.05,48.27a8.14,8.14,0,0,0-4.1,0L73.56,62.13,48.69,49.7a16,16,0,0,0-21.47,7.15L1.7,107.9a16,16,0,0,0,7.15,21.47l27,13.51,55.49,39.63a8.06,8.06,0,0,0,2.71,1.25l64,16a8,8,0,0,0,7.6-2.1l55.07-55.08,26.42-13.21a16,16,0,0,0,7.15-21.46Zm-54.89,33.37L165,113.72a8,8,0,0,0-10.68.61C136.51,132.27,116.66,130,104,122L147.24,80h31.81l27.21,54.41ZM41.53,64,62,74.22,36.43,125.27,16,115.06Zm116,119.13L99.42,168.61l-49.2-35.14,28-56L128,64.28l9.8,2.59-45,43.68-.08.09a16,16,0,0,0,2.72,24.81c20.56,13.13,45.37,11,64.91-5L188,152.66Zm62-57.87-25.52-51L214.47,64,240,115.06Zm-87.75,92.67a8,8,0,0,1-7.75,6.06,8.13,8.13,0,0,1-1.95-.24L80.41,213.33a7.89,7.89,0,0,1-2.71-1.25L51.35,193.26a8,8,0,0,1,9.3-13l25.11,17.94L126,208.24A8,8,0,0,1,131.82,217.94Z","cpu":"M152,96H104a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V104A8,8,0,0,0,152,96Zm-8,48H112V112h32Zm88,0H216V112h16a8,8,0,0,0,0-16H216V56a16,16,0,0,0-16-16H160V24a8,8,0,0,0-16,0V40H112V24a8,8,0,0,0-16,0V40H56A16,16,0,0,0,40,56V96H24a8,8,0,0,0,0,16H40v32H24a8,8,0,0,0,0,16H40v40a16,16,0,0,0,16,16H96v16a8,8,0,0,0,16,0V216h32v16a8,8,0,0,0,16,0V216h40a16,16,0,0,0,16-16V160h16a8,8,0,0,0,0-16Zm-32,56H56V56H200v95.87s0,.09,0,.13,0,.09,0,.13V200Z","chart-line-up":"M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31l-56,56V200H224A8,8,0,0,1,232,208Z","squares-four":"M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z","stack":"M230.91,172A8,8,0,0,1,228,182.91l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,36,169.09l92,53.65,92-53.65A8,8,0,0,1,230.91,172ZM220,121.09l-92,53.65L36,121.09A8,8,0,0,0,28,134.91l96,56a8,8,0,0,0,8.06,0l96-56A8,8,0,1,0,220,121.09ZM24,80a8,8,0,0,1,4-6.91l96-56a8,8,0,0,1,8.06,0l96,56a8,8,0,0,1,0,13.82l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,24,80Zm23.88,0L128,126.74,208.12,80,128,33.26Z","globe-hemisphere-west":"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16.11,16.11,0,0,0-16,7.86h-8.72l-3.8-7.86a15.91,15.91,0,0,0-11-8.67l-8-1.73L96.14,104h16.71a16.06,16.06,0,0,0,7.73-2l12.25-6.76a16.62,16.62,0,0,0,3-2.14l26.91-24.34A15.93,15.93,0,0,0,166,49.1l-.36-.65A88.11,88.11,0,0,1,216,128ZM143.31,41.34,152,56.9,125.09,81.24,112.85,88H96.14a16,16,0,0,0-13.88,8l-8.73,15.23L63.38,84.19,74.32,58.32a87.87,87.87,0,0,1,69-17ZM40,128a87.53,87.53,0,0,1,8.54-37.8l11.34,30.27a16,16,0,0,0,11.62,10l21.43,4.61L96.74,143a16.09,16.09,0,0,0,14.4,9h1.48l-7.23,16.23a16,16,0,0,0,2.86,17.37l.14.14L128,205.94l-1.94,10A88.11,88.11,0,0,1,40,128Zm102.58,86.78,1.13-5.81a16.09,16.09,0,0,0-4-13.9,1.85,1.85,0,0,1-.14-.14L120,174.74,133.7,144l22.82,3.08,45.72,28.12A88.18,88.18,0,0,1,142.58,214.78Z","user":"M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z","users":"M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z","users-three":"M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z","buildings":"M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z","sparkle":"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z","presentation-chart":"M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z","browser":"M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V88H40V56Zm0,144H40V104H216v96Z","megaphone":"M248,120a48.05,48.05,0,0,0-48-48H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48.07,48.07,0,0,0,248,120ZM48,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C134.65,155,90.84,164.07,48,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z","question":"M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z","hammer":"M251.34,112,183.88,44.08a96.1,96.1,0,0,0-135.77,0l-.09.09L34.25,58.4A8,8,0,0,0,45.74,69.53L59.47,55.35a79.92,79.92,0,0,1,18.71-13.9L124.68,88l-96,96a16,16,0,0,0,0,22.63l20.69,20.69a16,16,0,0,0,22.63,0l96-96,14.34,14.34h0L200,163.3a16,16,0,0,0,22.63,0l28.69-28.69A16,16,0,0,0,251.34,112ZM60.68,216,40,195.31l68-68L128.68,148ZM162.34,114.32,140,136.67,119.31,116l22.35-22.35a8,8,0,0,0,0-11.32L94.32,35a80,80,0,0,1,78.23,20.41l44.22,44.51L188,128.66l-14.34-14.34A8,8,0,0,0,162.34,114.32Zm49,37.66-12-12L228,111.25l12,12Z","arrows-clockwise":"M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z","infinity":"M248,128a56,56,0,0,1-95.6,39.6l-.33-.35L92.12,99.55a40,40,0,1,0,0,56.9l8.52-9.62a8,8,0,1,1,12,10.61l-8.69,9.81-.33.35a56,56,0,1,1,0-79.2l.33.35,59.95,67.7a40,40,0,1,0,0-56.9l-8.52,9.62a8,8,0,1,1-12-10.61l8.69-9.81.33-.35A56,56,0,0,1,248,128Z","flag":"M42.76,50A8,8,0,0,0,40,56V224a8,8,0,0,0,16,0V179.77c26.79-21.16,49.87-9.75,76.45,3.41,16.4,8.11,34.06,16.85,53,16.85,13.93,0,28.54-4.75,43.82-18a8,8,0,0,0,2.76-6V56A8,8,0,0,0,218.76,50c-28,24.23-51.72,12.49-79.21-1.12C111.07,34.76,78.78,18.79,42.76,50ZM216,172.25c-26.79,21.16-49.87,9.74-76.45-3.41-25-12.35-52.81-26.13-83.55-8.4V59.79c26.79-21.16,49.87-9.75,76.45,3.4,25,12.35,52.82,26.13,83.55,8.4Z","target":"M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32l27.72-27.72a40,40,0,1,0,17.87,31.09,8,8,0,1,1,16-.9,56,56,0,1,1-22.38-41.65L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z","link":"M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z","lightning":"M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z","calendar-blank":"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z","clock":"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z","compass":"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM172.42,72.84l-64,32a8.05,8.05,0,0,0-3.58,3.58l-32,64A8,8,0,0,0,80,184a8.1,8.1,0,0,0,3.58-.84l64-32a8.05,8.05,0,0,0,3.58-3.58l32-64a8,8,0,0,0-10.74-10.74ZM138,138,97.89,158.11,118,118l40.15-20.07Z","arrow-left":"M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z","arrow-right":"M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z","arrow-counter-clockwise":"M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z","caret-down":"M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z","check":"M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z","x":"M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"};
  const svg = (name) => `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;
  const MARK = '<svg class="fq__mark" viewBox="0 0 33 36" fill="none" aria-hidden="true"><path d="M30.3183 11.6507C27.0965 11.9882 24.0675 13.0833 21.3699 14.7434C20.9537 14.9999 20.495 14.6124 20.6881 14.1634C21.8667 11.4208 22.6244 4.91876 22.8609 1.96834C22.9477 0.886128 22.0522 0 20.9667 0H12.8724C11.9478 0 11.1241 0.744698 10.9953 1.66045C10.2775 6.75819 6.3968 14.9244 1.51683 15.7613C0.669375 15.9069 0 16.8423 0 17.7021V25.7424C0 26.8675 0.979663 27.7278 2.09987 27.626C5.42131 27.3244 8.53588 26.3114 11.296 24.7444C11.7013 24.5141 12.1392 24.963 11.9391 25.3844C10.675 28.0415 9.8567 30.9265 9.59187 33.8961C9.49177 35.0187 10.3459 36 11.4728 36H19.5849C20.52 36 21.3095 35.3145 21.4367 34.3875C22.1286 29.3419 25.9584 24.4532 30.795 23.527C31.6979 23.3543 32.439 22.4694 32.439 21.5504V13.5318C32.439 12.3987 31.4452 11.5326 30.3183 11.6507Z" fill="currentColor"/></svg>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- questions ---------- */
  const QS = [
    { id: 'industry', short: 'Industry', q: 'Which industry are you in?', a: [
      { t: 'Channel partner', s: 'Salesforce, NetSuite, HubSpot, ServiceNow', v: 'channel', chip: 'Channel partner', i: 'handshake' },
      { t: 'Technology', s: 'Security, AI, FinTech, SaaS & dev tools', v: 'tech', chip: 'Technology', i: 'cpu' },
      { t: 'Finance & Consulting', s: 'Consulting, advisory and financial services firms', v: 'finance', chip: 'Finance & Consulting', i: 'chart-line-up' },
      { t: 'Other', v: 'other', chip: 'Other industry', i: 'squares-four' }] },
    { id: 'ecosystem', short: 'Ecosystem', q: 'Which ecosystem do you work in?', when: (ans) => ans.industry === 0, a: [
      { t: 'Salesforce', chip: 'Salesforce', m: 'SF' }, { t: 'NetSuite', chip: 'NetSuite', m: 'NS' },
      { t: 'HubSpot', chip: 'HubSpot', m: 'HS' }, { t: 'ServiceNow', chip: 'ServiceNow', m: 'SN' },
      { t: 'Microsoft Dynamics', chip: 'Microsoft Dynamics', m: 'MD' }, { t: 'SAP', chip: 'SAP', m: 'SAP' },
      { t: 'We work with several', chip: 'Multi-vendor', i: 'stack' }, { t: 'Other', chip: 'Other ecosystem', i: 'squares-four' }] },
    { id: 'size', short: 'Team size', q: 'How many people work at your firm?', a: [
      { t: 'Under 50', dq: true, chip: 'Under 50 people', i: 'user' }, { t: '50–200', chip: '50–200 people', i: 'users' },
      { t: '200–500', chip: '200–500 people', i: 'users-three' }, { t: '500+', dq: true, chip: '500+ people', i: 'buildings' }] },
    { id: 'location', short: 'Location', q: 'Where is your firm based?', a: [
      { t: 'North America', s: 'US, Canada', chip: 'North America', m: 'NA' },
      { t: 'Europe', s: 'UK, France, Denmark, Sweden', chip: 'Europe', m: 'EU' },
      { t: 'Australia & New Zealand', chip: 'ANZ', m: 'ANZ' },
      { t: 'MENA', s: 'UAE, Saudi Arabia, Egypt, Qatar, Algeria', chip: 'MENA', m: 'MENA' },
      { t: 'Other', chip: 'Other region', i: 'globe-hemisphere-west' }] },
    { id: 'challenge', short: 'Challenges', q: 'What challenges is your firm facing?', multi: 3, a: [
      { t: 'Our brand', s: 'It doesn’t reflect how good we actually are', k: 'brand', chip: 'Brand', i: 'sparkle' },
      { t: 'Our sales assets', s: 'Decks and materials that aren’t winning deals', k: 'sales', chip: 'Sales assets', i: 'presentation-chart' },
      { t: 'Our website', s: 'It gets visits but doesn’t bring in leads', k: 'web', chip: 'Website', i: 'browser' },
      { t: 'Our marketing', s: 'Campaigns and content are inconsistent or slow', k: 'marketing', chip: 'Marketing', i: 'megaphone' },
      { t: 'I’m not sure yet', s: 'Something’s off and we’d like help finding what', k: 'unsure', exclusive: true, chip: 'Not sure yet', i: 'question' }] },
    { id: 'help', short: 'Help', q: 'What kind of help do you need?', when: (ans) => !(Array.isArray(ans.challenge) && ans.challenge.indexOf(4) !== -1), a: [
      { t: 'A one-time build', s: 'Fix it once and fix it right, before a launch, merger or rebrand', v: 'once', chip: 'One-time build', i: 'hammer' },
      { t: 'Ongoing support', s: 'We can’t keep up with creative requests', v: 'ongoing', chip: 'Ongoing support', i: 'arrows-clockwise' },
      { t: 'Both', s: 'Build it first, then keep it going', v: 'both', chip: 'Both', i: 'infinity' }] },
    { id: 'role', short: 'Role', q: 'What’s your role?', a: [
      { t: 'Founder / CEO', chip: 'Founder / CEO', i: 'flag' }, { t: 'Marketing', chip: 'Marketing', i: 'megaphone' },
      { t: 'Sales', chip: 'Sales', i: 'target' }, { t: 'Partnerships / Alliances', chip: 'Partnerships', i: 'link' },
      { t: 'Other', chip: 'Other role', i: 'squares-four' }] },
    { id: 'timing', short: 'Timing', q: 'How urgent is this?', a: [
      { t: 'Urgent', s: 'Let’s talk today or tomorrow', v: 'urgent', chip: 'Urgent', i: 'lightning' },
      { t: 'Soon', s: 'In the next couple of weeks', v: 'soon', chip: 'Soon', i: 'calendar-blank' },
      { t: 'Not urgent', s: 'In the next few months', v: 'later', chip: 'Not urgent', i: 'clock' },
      { t: 'Just exploring', v: 'exploring', chip: 'Exploring', i: 'compass' }] }
  ];
  const byId = (id) => QS.find((q) => q.id === id);

  /* ---------- state ---------- */
  let ans = {}, cur = 0, done = false, sent = false, sumOpen = false, busy = false, dir = 1, timer = 0, shownAt = 0;
  let root, slide, head, countEl, barFill, opener = null;

  const active = () => QS.filter((q) => !q.when || q.when(ans));
  const answered = (q) => { const a = ans[q.id]; return Array.isArray(a) ? a.length > 0 : a !== undefined; };
  const pick = (id) => (ans[id] === undefined || Array.isArray(ans[id])) ? null : byId(id).a[ans[id]];
  const picks = (id) => (Array.isArray(ans[id]) ? ans[id] : []).map((i) => byId(id).a[i]);
  const current = () => { const l = active(); return l[Math.min(cur, l.length - 1)]; };
  function optState(q, j) {
    const a = ans[q.id];
    if (!q.multi) return { on: a === j, off: false };
    const sel = Array.isArray(a) ? a : [], on = sel.indexOf(j) !== -1, ex = !!q.a[j].exclusive;
    return { on, off: !on && !ex && (sel.length >= q.multi || sel.some((i) => q.a[i].exclusive)) };
  }

  /* ---------- result copy ---------- */
  function verdict() {
    const ORDER = ['brand', 'sales', 'web', 'marketing'];
    const ch = picks('challenge');
    const unsure = !ch.length || ch.some((c) => c.exclusive);
    const keys = ch.map((c) => c.k).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const HL = {
      'brand': 'Your brand should sell before you do.',
      'sales': 'Give your sales reps assets they can actually use to win you deals.',
      'web': 'Your website should be your hardest-working rep.',
      'marketing': 'Keep your marketing moving, every single week.',
      'brand+sales': 'One brand, one story, in every deck you send.',
      'brand+web': 'Look as good online as you are in delivery.',
      'brand+marketing': 'A brand worth noticing, and campaigns that keep it seen.',
      'sales+web': 'Turn visits into meetings and meetings into deals.',
      'sales+marketing': 'Marketing that fills the pipeline, assets that close it.',
      'web+marketing': 'A website and campaigns that bring in leads every week.',
      'brand+sales+web': 'Rebuild the three places buyers judge you first.',
      'brand+sales+marketing': 'One story, told well, from first post to final proposal.',
      'brand+web+marketing': 'Be seen, be remembered, be the one they call.',
      'sales+web+marketing': 'Every touchpoint working to win you deals.',
      'unsure': 'Let us audit your brand and figure out what’s missing.'
    };
    const headline = unsure ? HL.unsure : HL[keys.join('+')];

    const ind = pick('industry'), eco = pick('ecosystem');
    let who = 'B2B firms like you';
    if (ind && ind.v === 'channel') {
      const vendors = ['Salesforce', 'NetSuite', 'HubSpot', 'ServiceNow', 'Microsoft Dynamics', 'SAP'];
      if (eco && vendors.indexOf(eco.t) !== -1) who = eco.t + ' partners like you';
      else if (eco && eco.chip === 'Multi-vendor') who = 'multi-vendor partners like you';
      else who = 'channel partners like you';
    } else if (ind && ind.v === 'tech') who = 'tech companies like you';
    else if (ind && ind.v === 'finance') who = 'consulting and finance firms like you';

    const SINGLE = {
      brand: `We help ${who} build brands buyers trust before the first call.`,
      sales: `We help ${who} give every rep the same winning story, from first call to close.`,
      web: `We help ${who} build websites that look, sound and sell like the rest of their brand.`,
      marketing: `We help ${who} keep every campaign on brand, however fast it needs to ship.`
    };
    const NOUN = { brand: 'brand', sales: 'sales assets', web: 'website', marketing: 'marketing' };
    let para, free = false;
    if (unsure) { para = 'We’ll diagnose your business and spot the gaps across your brand, sales, website and marketing.'; free = true; }
    else {
      const n = keys.map((k) => NOUN[k]);   // one short sentence: who they are + what we fix
      para = keys.length === 1 ? SINGLE[keys[0]] : `We help ${who} fix their ${n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0]}, so one story comes through everywhere.`;
    }
    const t = pick('timing'), tv = t ? t.v : '';
    const when = tv === 'urgent' ? 'We’ll be in touch as soon as possible.' : tv === 'soon' ? 'We’ll be in touch shortly.' : tv === 'exploring' ? 'We’ll be here whenever you’re ready.' : 'We’ll be in touch soon.';
    return { headline, para, free, when };
  }
  const recap = () => active().filter(answered).map((q) => {
    const a = ans[q.id];
    return { q: q.short, a: Array.isArray(a) ? a.map((i) => q.a[i].chip).join(', ') : q.a[a].chip };
  });

  /* ---------- markup ---------- */
  function questionHTML() {
    const q = current(), sel = Array.isArray(ans[q.id]) ? ans[q.id] : [];
    const cards = q.a.map((a, j) => {
      const st = optState(q, j);
      const wide = a.exclusive || (q.a.length % 2 === 1 && j === q.a.length - 1);
      const ico = a.i ? svg(a.i) : `<span class="fq__mono">${esc(a.m)}</span>`;
      return (a.exclusive ? '<div class="fq__or" aria-hidden="true">or</div>' : '') +
        `<button type="button" class="fq__opt${st.on ? ' is-on' : ''}${st.off ? ' is-off' : ''}${wide ? ' fq__opt--wide' : ''}${a.s ? ' has-s' : ''}" data-opt="${j}" aria-pressed="${st.on}"${st.off ? ' aria-disabled="true"' : ''}>` +
        `<span class="fq__ico">${ico}</span><span class="fq__txt"><span class="fq__t">${esc(a.t)}</span>${a.s ? `<span class="fq__s">${esc(a.s)}</span>` : ''}</span></button>`;
    }).join('');
    const right = q.multi
      ? `<span class="fq__picked">${sel.length ? `${sel.length} of ${q.multi} picked` : `Pick up to ${q.multi}`}</span><button type="button" class="fq__next" data-next${sel.length ? '' : ' disabled'}><span>Continue</span></button>`
      : `<span class="fq__hint">Press 1–${q.a.length}</span>`;
    return `<h2 class="fq__q" id="fq-q" tabindex="-1">${esc(q.q)}</h2>` +
      `<p class="fq__sub">${q.multi ? 'Pick up to 3, or choose “I’m not sure yet” on its own.' : 'Pick one.'}</p>` +
      `<div class="fq__opts${q.a.length === 8 ? ' fq__opts--4' : ''}" role="group" aria-labelledby="fq-q">${cards}</div>` +
      `<div class="fq__nav"><button type="button" class="fq__back${cur === 0 ? ' is-hidden' : ''}" data-back>${svg('arrow-left')}Back</button><div class="fq__right">${right}</div></div>`;
  }
  function resultHTML() {
    const v = verdict(), rows = recap();
    const answers = `<div class="fq__sum${sumOpen ? ' is-open' : ''}"><button type="button" class="fq__sum-head" data-sum aria-expanded="${sumOpen}"><span>Your answers</span><span class="fq__sum-meta">${sumOpen ? 'Hide' : 'Show'}${svg('caret-down')}</span></button>` +
      (sumOpen ? `<div class="fq__sum-list">${rows.map((r) => `<div class="fq__sum-row"><span>${esc(r.q)}</span><span>${esc(r.a)}</span></div>`).join('')}</div>` : '') + '</div>';
    const form = sent ? '' : `<form class="fq__lead" novalidate data-lead>
        <div class="fq__field"><label class="fq__lbl" for="fq-name">Name</label><input class="fq__in" id="fq-name" name="name" type="text" autocomplete="name" placeholder="Your full name"><p class="fq__err" data-err-name hidden></p></div>
        <div class="fq__field"><label class="fq__lbl" for="fq-email">Work email</label><input class="fq__in" id="fq-email" name="email" type="email" autocomplete="email" placeholder="you@company.com"><p class="fq__err" data-err-email hidden></p></div>
        <input type="text" name="_honey" tabindex="-1" autocomplete="off" class="fq__honey" aria-hidden="true">
        <button type="submit" class="fq__send"><span>Send</span></button>
        <p class="fq__err fq__err--form" data-err-form hidden></p>
      </form>`;
    const thanks = sent ? `<div class="fq__sent"><span class="fq__sent-ico">${svg('check')}</span><div><p>Got it, ${esc(sent)}. ${esc(v.when)}</p><a href="contact.html" data-full-form>Want to add more? Open the full form</a></div></div>` : '';
    return `<div class="fq__res"><div class="fq__ring" aria-hidden="true">${svg('check')}</div>` +
      `<h2 class="fq__vt" tabindex="-1">${esc(v.headline)}</h2>` +
      `<p class="fq__vp">${esc(v.para)}${v.free ? ' <strong>Completely free.</strong>' : ''}</p>` +
      answers + form + thanks +
      `<button type="button" class="fq__again" data-restart>${svg('arrow-counter-clockwise')}Start over</button></div>`;
  }

  /* ---------- render ---------- */
  function renderChrome() {
    const l = active(), n = l.filter(answered).length;
    head.hidden = done;
    countEl.textContent = `${Math.min(cur, l.length - 1) + 1} / ${l.length}`;
    barFill.style.width = (n / l.length * 100) + '%';
    root.classList.toggle('is-result', done);
  }
  /* keep the whole step on one screen: shrink the card a little (never below 72%) when the window is short */
  function fit() {
    if (!root) return;
    const col = root.querySelector('.fq__col');
    col.style.zoom = '';
    if (window.innerWidth < 768) return;   // phones scroll as normal
    const z = Math.max(0.72, Math.min(1, (window.innerHeight - 48) / col.offsetHeight));
    if (z < 1) col.style.zoom = String(Math.floor(z * 100) / 100);
  }
  function render(animate) {
    renderChrome();
    slide.innerHTML = done ? resultHTML() : questionHTML();
    fit();
    if (animate) { slide.classList.remove('is-fwd', 'is-back'); void slide.offsetWidth; slide.classList.add(dir > 0 ? 'is-fwd' : 'is-back'); }
  }
  function refreshOptions() {
    const tmp = document.createElement('div'); tmp.innerHTML = questionHTML();
    slide.querySelector('.fq__opts').replaceWith(tmp.querySelector('.fq__opts'));
    slide.querySelector('.fq__right').replaceWith(tmp.querySelector('.fq__right'));
    renderChrome();
    fit();
  }
  function focusFirst() {
    const t = slide.querySelector(done ? '.fq__vt' : '.fq__q');
    if (t) t.focus({ preventScroll: true });
  }
  function goTo(i, d) { cur = i; done = false; dir = d; render(true); root.scrollTop = 0; focusFirst(); }
  function finish() { done = true; dir = 1; shownAt = Date.now(); render(true); root.scrollTop = 0; focusFirst(); }
  function advance() {
    const l = active();
    let n = -1;
    for (let k = cur + 1; k < l.length; k++) if (!answered(l[k])) { n = k; break; }
    if (n === -1) n = l.findIndex((q) => !answered(q));
    if (n === -1) finish(); else goTo(n, 1);
  }
  function back() { if (cur > 0 && !busy) goTo(cur - 1, -1); }
  function choose(j) {
    if (busy || done) return;
    const q = current();
    if (optState(q, j).off) return;
    if (q.multi) {
      let sel = Array.isArray(ans[q.id]) ? ans[q.id].slice() : [];
      const at = sel.indexOf(j);
      if (at !== -1) sel.splice(at, 1); else if (q.a[j].exclusive) sel = [j]; else sel.push(j);
      ans[q.id] = sel;
      refreshOptions();
      const b = slide.querySelector(`[data-opt="${j}"]`); if (b) b.focus({ preventScroll: true });
      return;
    }
    ans[q.id] = j;
    if (q.id === 'industry' && q.a[j].v !== 'channel') delete ans.ecosystem;
    refreshOptions();
    busy = true; clearTimeout(timer);
    timer = setTimeout(() => { busy = false; advance(); }, 300);
  }
  function restart() { clearTimeout(timer); busy = false; ans = {}; sent = false; sumOpen = false; goTo(0, -1); }

  /* ---------- lead ---------- */
  const readStored = () => { try { return +localStorage.getItem(KEY) || 0; } catch (x) { return 0; } };
  const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (x) { /* blocked */ } };
  function setErr(sel, msg, input) {
    const p = slide.querySelector(sel); if (!p) return;
    p.textContent = msg || ''; p.hidden = !msg;
    if (input) input.classList.toggle('is-err', !!msg);
  }
  async function submit(form) {
    const name = form.name.value.trim(), email = form.email.value.trim();
    setErr('[data-err-name]', '', form.name); setErr('[data-err-email]', '', form.email); setErr('[data-err-form]', '');
    let bad = null;
    if (!name) { setErr('[data-err-name]', 'Add your name so we know who to reply to.', form.name); bad = bad || form.name; }
    if (!email) { setErr('[data-err-email]', 'Add your work email so we can reach you.', form.email); bad = bad || form.email; }
    else if (!emailRe.test(email)) { setErr('[data-err-email]', 'That email doesn’t look right. Check it and try again.', form.email); bad = bad || form.email; }
    if (bad) { bad.focus(); return; }
    const first = name.split(/\s+/)[0];
    const finished = () => { sent = first; render(false); const s = slide.querySelector('.fq__sent'); if (s) s.scrollIntoView({ block: 'nearest' }); };
    if (form._honey.value || Date.now() - shownAt < 1500) { finished(); return; }   // bot: looks like success, nothing is sent
    const left = readStored() ? readStored() + COOLDOWN - Date.now() : 0;
    if (left > 0 && left <= COOLDOWN) { setErr('[data-err-form]', 'Your answers have already been sent from this device. To keep our inbox free of spam, the quiz can be sent once per hour.'); return; }
    const btn = form.querySelector('.fq__send'); btn.disabled = true; btn.firstChild.textContent = 'Sending...';
    const size = pick('size'), body = { Name: name, Email: email };
    recap().forEach((r) => { body[r.q] = r.a; });
    Object.assign(body, {
      Source: 'Fit quiz', 'Needs review': size && size.dq ? 'Yes (size outside 50–500)' : 'No',
      Page: location.href, 'Sent at': new Date().toString(),
      _subject: `New fit quiz lead from ${name} - Positiv website`, _replyto: email, _template: 'table', _captcha: 'false'
    });
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(ENDPOINT, { signal: ctl.signal, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      clearTimeout(t);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`);
      remember();
      finished();
    } catch (x) {
      console.warn('fit quiz:', x);
      btn.disabled = false; btn.firstChild.textContent = 'Send';
      setErr('[data-err-form]', 'We could not send your answers just now. Please try again in a few minutes, or write to hello@positiv.studio.');
    }
  }
  function openFullForm() {
    const ind = pick('industry'), size = pick('size');
    const NEED = { brand: 'Brand', sales: 'Sales assets', web: 'Website', marketing: 'Marketing', unsure: "I'm not sure yet" };
    const answers = { industry: ind ? ind.t : '', size: size ? size.t : '', need: picks('challenge').map((c) => NEED[c.k]) };
    close(true);
    if (window.PositivContact) window.PositivContact.open(answers);
    else if (!/\/contact(\.html)?$/.test(location.pathname)) location.href = 'contact.html';
  }

  /* ---------- shell ---------- */
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'fq';
    root.id = 'fit-quiz';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('data-lenis-prevent', '');
    root.innerHTML = `
      <button type="button" class="fq__close" data-close aria-label="Close the quiz">${svg('x')}</button>
      <div class="fq__col" role="dialog" aria-modal="true" aria-label="Are you the right fit?" tabindex="-1">
        <div class="fq__head">
          ${MARK}
          <div class="fq__title-row"><p class="fq__name">Are you the right fit?</p><span class="fq__count" aria-live="polite"></span></div>
          <div class="fq__bar" aria-hidden="true"><i></i></div>
        </div>
        <div class="fq__slide"></div>
      </div>`;
    document.body.appendChild(root);
    head = root.querySelector('.fq__head'); slide = root.querySelector('.fq__slide');
    countEl = root.querySelector('.fq__count'); barFill = root.querySelector('.fq__bar i');

    root.addEventListener('click', (e) => {
      if (e.target === root || e.target.closest('[data-close]')) { close(); return; }   // backdrop or close button
      const o = e.target.closest('[data-opt]');
      if (o) { if (o.getAttribute('aria-disabled') !== 'true') choose(+o.dataset.opt); return; }
      if (e.target.closest('[data-next]')) { if (answered(current())) advance(); return; }
      if (e.target.closest('[data-back]')) { back(); return; }
      if (e.target.closest('[data-sum]')) {
        sumOpen = !sumOpen;
        const tmp = document.createElement('div'); tmp.innerHTML = resultHTML();
        slide.querySelector('.fq__sum').replaceWith(tmp.querySelector('.fq__sum'));
        slide.querySelector('[data-sum]').focus({ preventScroll: true });
        fit();
        return;
      }
      if (e.target.closest('[data-restart]')) { restart(); return; }
      if (e.target.closest('[data-full-form]')) { e.preventDefault(); e.stopPropagation(); openFullForm(); }
    });
    window.addEventListener('resize', () => { if (root.classList.contains('is-open')) fit(); });
    root.addEventListener('submit', (e) => { if (e.target.matches('[data-lead]')) { e.preventDefault(); submit(e.target); } });
    root.addEventListener('input', (e) => {
      if (e.target.name === 'name') setErr('[data-err-name]', '', e.target);
      if (e.target.name === 'email') setErr('[data-err-email]', '', e.target);
    });
  }

  function onKey(e) {
    if (!root || !root.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {   // keep focus inside the pop-up
      const f = [...root.querySelectorAll('button:not([disabled]), a[href], input:not(.fq__honey), [tabindex="-1"].fq__col')].filter((el) => el.offsetParent !== null || el === root.querySelector('.fq__close'));
      const list = f.filter((el) => !el.classList.contains('fq__col'));
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (done || busy || e.metaKey || e.ctrlKey || e.altKey) return;
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    const q = current(), n = parseInt(e.key, 10);
    if (n >= 1 && n <= q.a.length) { e.preventDefault(); choose(n - 1); }
    else if (e.key === 'Enter' && q.multi && answered(q) && !(tg && tg.closest && tg.closest('[data-opt]'))) { e.preventDefault(); advance(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  }

  function open(from) {
    build();
    opener = from || document.activeElement;
    if (!Object.keys(ans).length || sent) { ans = {}; cur = 0; done = false; sent = false; sumOpen = false; }
    dir = 1; render(false);
    document.documentElement.classList.add('fq-lock');
    root.setAttribute('aria-hidden', 'false');
    root.scrollTop = 0;
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { root.classList.add('is-open'); focusFirst(); });
  }
  function close(keepHash) {
    if (!root || !root.classList.contains('is-open')) return;
    clearTimeout(timer); busy = false;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('fq-lock');
    document.removeEventListener('keydown', onKey);
    if (location.hash === '#fit-quiz') history.replaceState(null, '', location.pathname + location.search);
    if (!keepHash && opener && opener.focus) opener.focus({ preventScroll: true });
  }

  /* triggers: "Book a call" in the Expertise menu card, [data-fit-quiz], links to #fit-quiz */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target.closest('.link-block-20, [data-fit-quiz], a[href="#fit-quiz"]');
    if (!t) return;
    e.preventDefault();
    open(t);
  }, true);

  window.PositivFitQuiz = { open: () => open(null), close: () => close() };
  if (location.hash === '#fit-quiz') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => open()); else open();
  }
})();
