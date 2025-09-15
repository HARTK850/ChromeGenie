class ChromeGenie {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = localStorage.getItem("api_key_valid") === "true"
    this.chatHistory = [] // היסטוריית צ'אט: [{role: 'user'|'model', content: string}]
    this.initializeElements()
    this.bindEvents()
    this.loadSavedApiKey()
  }

  initializeElements() {
    this.ideaInput = document.getElementById("ideaInput")
    this.apiKeyInput = document.getElementById("apiKey")
    this.validateApiBtn = document.getElementById("validateApiBtn")
    this.apiStatus = document.getElementById("apiStatus")
    this.generateBtn = document.getElementById("generateBtn")
    this.btnText = document.querySelector(".btn-text")
    this.btnLoader = document.querySelector(".btn-loader")
    this.outputSection = document.getElementById("outputSection")
    this.chatContainer = document.getElementById("chatContainer")
    this.followUpInput = document.getElementById("followUpInput")
    this.sendFollowUpBtn = document.getElementById("sendFollowUpBtn")
    this.copyBtn = document.getElementById("copyBtn")
    this.downloadBtn = document.getElementById("downloadBtn")

    if (!this.validateApiBtn) {
      console.error("[ChromeGenie] Error: validateApiBtn not found in DOM!")
      alert("שגיאה: כפתור בדיקת API לא נמצא. בדוק את ה-HTML.")
    }
    if (!this.apiKeyInput) {
      console.error("[ChromeGenie] Error: apiKeyInput not found in DOM!")
    }
  }

  bindEvents() {
    if (this.validateApiBtn) {
      this.validateApiBtn.addEventListener("click", () => this.validateApiKey())
    }
    if (this.generateBtn) {
      this.generateBtn.addEventListener("click", () => this.startChat())
    }
    if (this.sendFollowUpBtn) {
      this.sendFollowUpBtn.addEventListener("click", () => this.sendFollowUp())
    }
    if (this.copyBtn) {
      this.copyBtn.addEventListener("click", () => this.copyLastResponse())
    }
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", () => this.downloadExtension())
    }
    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener("input", () => this.onApiKeyChange())
    }
    if (this.followUpInput) {
      this.followUpInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendFollowUp()
      })
    }
  }

  loadSavedApiKey() {
    if (this.apiKey) {
      this.apiKeyInput.value = this.apiKey
      if (this.isApiKeyValid) {
        this.showApiStatus("מפתח תקין ✓", "success")
      }
    }
  }

  onApiKeyChange() {
    this.isApiKeyValid = false
    localStorage.removeItem("api_key_valid")
    this.apiStatus.textContent = ""
    this.apiStatus.className = "api-status"
  }

  async validateApiKey() {
    console.log("[ChromeGenie] Starting API key validation...")
    const apiKey = this.apiKeyInput.value.trim()

    if (!apiKey) {
      this.showApiStatus("אנא הכנס מפתח API", "error")
      console.warn("[ChromeGenie] No API key entered.")
      return
    }

    this.validateApiBtn.disabled = true
    this.validateApiBtn.textContent = "בודק..."

    try {
      console.log("[ChromeGenie] Sending request to Gemini API...")
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "בדיקה",
                  },
                ],
              },
            ],
          }),
        },
      )

      if (response.ok) {
        console.log("[ChromeGenie] API key validated successfully.")
        this.apiKey = apiKey
        this.isApiKeyValid = true
        localStorage.setItem("gemini_api_key", apiKey)
        localStorage.setItem("api_key_valid", "true")
        this.showApiStatus("מפתח תקין ✓", "success")
      } else {
        const errorData = await response.json()
        console.error("[ChromeGenie] API validation failed:", errorData)
        throw new Error("מפתח לא תקין: " + (errorData.error?.message || "שגיאה לא ידועה"))
      }
    } catch (error) {
      console.error("[ChromeGenie] Error during validation:", error)
      this.showApiStatus("מפתח לא תקין ✗: " + error.message, "error")
      this.isApiKeyValid = false
      localStorage.removeItem("api_key_valid")
      alert("שגיאה בבדיקת המפתח: " + error.message)
    } finally {
      this.validateApiBtn.disabled = false
      this.validateApiBtn.textContent = "בדוק מפתח"
      console.log("[ChromeGenie] Validation process completed.")
    }
  }

  showApiStatus(message, type) {
    this.apiStatus.textContent = message
    this.apiStatus.className = `api-status ${type}`
  }

  async startChat() {
    const idea = this.ideaInput.value.trim()

    if (!idea) {
      alert("אנא תאר את הרעיון שלך לתוסף")
      return
    }

    if (!this.isApiKeyValid) {
      alert("אנא בדוק ושמור את מפתח ה-API תחילה")
      return
    }

    this.chatHistory = [] // אפס היסטוריה להתחלה חדשה
    this.chatHistory.push({ role: "user", content: idea })
    this.renderChat()
    this.outputSection.style.display = "block"
    this.outputSection.scrollIntoView({ behavior: "smooth" })

    this.setGenerateButtonLoading(true)

    try {
      const response = await this.callGeminiAPI()
      this.chatHistory.push({ role: "model", content: response })
      this.renderChat()
    } catch (error) {
      console.error("[ChromeGenie] Error generating extension:", error)
      alert("שגיאה ביצירת התוסף: " + error.message)
    } finally {
      this.setGenerateButtonLoading(false)
    }
  }

  async sendFollowUp() {
    const message = this.followUpInput.value.trim()
    if (!message) return

    this.chatHistory.push({ role: "user", content: message })
    this.renderChat()
    this.followUpInput.value = ""
    this.sendFollowUpBtn.disabled = true

    try {
      const response = await this.callGeminiAPI()
      this.chatHistory.push({ role: "model", content: response })
      this.renderChat()
    } catch (error) {
      console.error("[ChromeGenie] Error in follow-up:", error)
      alert("שגיאה בשליחת הודעה: " + error.message)
    } finally {
      this.sendFollowUpBtn.disabled = false
    }
  }

  setGenerateButtonLoading(loading) {
    this.generateBtn.disabled = loading
    if (loading) {
      this.btnText.style.display = "none"
      this.btnLoader.style.display = "inline"
    } else {
      this.btnText.style.display = "inline"
      this.btnLoader.style.display = "none"
    }
  }

  async callGeminiAPI() {
    const basePrompt = `צור תוסף כרום מלא ופונקציונלי על בסיס הרעיון וההקשר מההודעות הקודמות.

אנא צור את הקבצים הבאים עם קוד מלא ומוכן לשימוש:

1. manifest.json - עם Manifest V3
2. popup.html - ממשק משתמש נקי ופונקציונלי
3. popup.js - כל הלוגיקה הנדרשת
4. styles.css - עיצוב יפה ומודרני

דרישות:
- השתמש ב-Manifest V3 בלבד
- קוד נקי וקריא עם הערות בעברית
- ממשק משתמש פשוט ואינטואיטיבי
- פונקציונליות מלאה ומוכנה לשימוש
- עיצוב מודרני ונעים לעין

הצג את הקבצים בפורמט הבא:
=== manifest.json ===
[קוד]

=== popup.html ===
[קוד]

=== popup.js ===
[קוד]

=== styles.css ===
[קוד]`

    const contents = this.chatHistory.map(msg => ({
      parts: [{ text: msg.role === "user" ? msg.content : msg.content }]
    }))
    contents.unshift({ parts: [{ text: basePrompt }] }) // הוסף פרומפט בסיסי בהתחלה

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || "שגיאה בקריאה ל-API של Gemini")
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  renderChat() {
    this.chatContainer.innerHTML = ""
    this.chatHistory.forEach(msg => {
      const bubble = document.createElement("div")
      bubble.className = `chat-bubble ${msg.role === "user" ? "user" : "ai"}`
      bubble.textContent = msg.content
      this.chatContainer.appendChild(bubble)
    })
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight
  }

  async copyLastResponse() {
    const lastAiMessage = this.chatHistory[this.chatHistory.length - 1]?.content || ""
    try {
      await navigator.clipboard.writeText(lastAiMessage)
      const originalText = this.copyBtn.textContent
      this.copyBtn.textContent = "הועתק! ✓"
      setTimeout(() => {
        this.copyBtn.textContent = originalText
      }, 2000)
    } catch (error) {
      console.error("[ChromeGenie] Copy failed:", error)
      alert("שגיאה בהעתקה")
    }
  }

  downloadExtension() {
    const lastAiMessage = this.chatHistory[this.chatHistory.length - 1]?.content || ""
    try {
      const files = this.parseGeneratedCode(lastAiMessage)
      this.createAndDownloadZip(files)
    } catch (error) {
      console.error("[ChromeGenie] Download failed:", error)
      alert("שגיאה בהורדה. אנא העתק את הקוד ושמור ידנית.")
    }
  }

  parseGeneratedCode(code) {
    const files = {}
    const sections = code.split(/===\s*([^=]+)\s*===/g)

    for (let i = 1; i < sections.length; i += 2) {
      const filename = sections[i].trim()
      const content = sections[i + 1] ? sections[i + 1].trim() : ""
      if (filename && content) {
        files[filename] = content
      }
    }

    if (Object.keys(files).length === 0) {
      files["extension-code.txt"] = code
    }

    return files
  }

  createAndDownloadZip(files) {
    if (!window.JSZip) {
      console.error("[ChromeGenie] JSZip not loaded!")
      alert("שגיאה: ספריית JSZip לא נטענה. בדוק את החיבור ל-CDN.")
      return
    }
    const JSZip = window.JSZip
    const zip = new JSZip()

    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content)
    })

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = "chrome-extension.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }
}

// הוספת JSZip מ-CDN
const script = document.createElement("script")
script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
script.onload = () => {
  console.log("[ChromeGenie] JSZip loaded successfully.")
  window.JSZip = window.JSZip || {}
  new ChromeGenie()
}
script.onerror = () => {
  console.error("[ChromeGenie] Failed to load JSZip!")
  alert("שגיאה בטעינת ספריית JSZip. בדוק את החיבור לאינטרנט.")
}
document.head.appendChild(script)

document.addEventListener("DOMContentLoaded", () => {
  if (window.JSZip && !window.chromeGenieInstance) {
    window.chromeGenieInstance = new ChromeGenie()
  }
})
