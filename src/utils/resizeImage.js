// מקטין תמונה שהמשתמש בחר, והופך אותה לטקסט (Base64) שאפשר לשמור ב-Firestore.
// למה להקטין? מסמך ב-Firestore מוגבל ל-1MB, ותמונה מהטלפון יכולה להיות 5MB.
//
// השלבים:
// 1. FileReader קורא את הקובץ
// 2. יוצרים אלמנט <img> ונותנים לו את התמונה
// 3. מציירים אותה על <canvas> בגודל קטן יותר
// 4. canvas.toDataURL מחזיר את התמונה הקטנה כטקסט

export function resizeImage(file, maxSize = 800) {
  // Promise - כי טעינת תמונה לוקחת זמן, והתוצאה מגיעה "אחר כך"
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const img = new Image()

      img.onload = () => {
        // מחשבים גודל חדש ששומר על היחס בין הרוחב לגובה
        let width = img.width
        let height = img.height
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        // JPEG באיכות 70% - מספיק טוב, וקטן בהרבה
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }

      img.onerror = reject
      img.src = reader.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
