class ChromeGenie {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = localStorage.getItem("api_key_valid") === "true"
    this.settings = JSON.parse(localStorage.getItem("genie_settings")) || {
      model: "gemini-2.5-flash", // המודל המוגדר כברירת מחדל
      temperature: 0.7,
      top_p: 0.95,
      top_k: 40,
      max_tokens: 1024
    }
    this.chatHistory = []
    this.chats = JSON.parse(localStorage.getItem("genie_chats")) || [] // [{id, name, history, favorite}]
    this.currentChatId = null
    this.initializeElements()
    this.bindEvents()
    this.loadSavedApiKey()
  }

  initializeElements() {
    this.ideaInput = document.getElementById("ideaInput")
    this.generateBtn = document.getElementById("generateBtn")
    this.btnText = document.querySelector(".btn-text")
    this.btnLoader = document.querySelector(".btn-loader")
    this.outputSection = document.getElementById("outputSection")
    this.chatContainer = document.getElementById("chatContainer")
    this.followUpInput = document.getElementById("followUpInput")
    this.sendFollowUpBtn = document.getElementById("sendFollowUpBtn")
    this.copyBtn = document.getElementById("copyBtn")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.historyBtn = document.getElementById("historyBtn")
    this.apiBtn = document.getElementById("apiBtn")
    this.settingsBtn = document.getElementById("settingsBtn")
    this.historyModal = document.getElementById("historyModal")
    this.apiModal = document.getElementById("apiModal")
    this.settingsModal = document.getElementById("settingsModal")
    this.historyList = document.getElementById("historyList")
    this.apiKeyInput = document.getElementById("apiKey")
    this.validateApiBtn = document.getElementById("validateApiBtn")
    this.apiStatus = document.getElementById("apiStatus")
    this.modelSelect = document.getElementById("modelSelect")
    this.temperatureInput = document.getElementById("temperatureInput")
    this.topPInput = document.getElementById("topPInput")
    this.topKInput = document.getElementById("topKInput")
    this.maxTokensInput = document.getElementById("maxTokensInput")
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn")
    this.saveApiBtn = document.getElementById("saveApiBtn")

    if (!this.generateBtn) {
      console.error("[ChromeGenie] Error: generateBtn not found in DOM!")
      alert("שגיאה: כפתור יצירה לא נמצא. בדוק את ה-HTML.")
    }
  }

  bindEvents() {
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
    if (this.followUpInput) {
      this.followUpInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendFollowUp()
      })
    }
    if (this.historyBtn) {
      this.historyBtn.addEventListener("click", () => this.toggleModal("historyModal"))
    }
    if (this.apiBtn) {
      this.apiBtn.addEventListener("click", () => this.toggleModal("apiModal"))
    }
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => this.toggleModal("settingsModal"))
    }
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener("click", () => this.saveSettings())
    }
    if (this.saveApiBtn) {
      this.saveApiBtn.addEventListener("click", () => this.saveApiKey())
    }
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) this.closeModals()
    })
  }

  toggleModal(modalId) {
    this.closeModals()
    document.getElementById(modalId).style.display = "block"
    if (modalId === "historyModal") this.renderHistoryList()
    if (modalId === "settingsModal") this.renderSettings()
    if (modalId === "apiModal") this.loadSavedApiKey() // טען את המפתח שמור לחלונית
  }

  closeModals() {
    [this.historyModal, this.apiModal, this.settingsModal].forEach(modal => {
      if (modal) modal.style.display = "none"
    })
  }

  renderSettings() {
    this.modelSelect.value = this.settings.model
    this.temperatureInput.value = this.settings.temperature
    this.topPInput.value = this.settings.top_p
    this.topKInput.value = this.settings.top_k
    this.maxTokensInput.value = this.settings.max_tokens
  }

  saveSettings() {
    this.settings = {
      model: this.modelSelect.value,
      temperature: parseFloat(this.temperatureInput.value),
      top_p: parseFloat(this.topPInput.value),
      top_k: parseInt(this.topKInput.value),
      max_tokens: parseInt(this.maxTokensInput.value)
    }
    localStorage.setItem("genie_settings", JSON.stringify(this.settings))
    alert("הגדרות נשמרו!")
    this.closeModals()
  }

  loadSavedApiKey() {
    if (this.apiKey) {
      this.apiKeyInput.value = this.apiKey
      if (this.isApiKeyValid) {
        this.showApiStatus("מפתח תקין ✓", "success")
      }
    }
  }

  saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim()
    if (!apiKey) {
      this.showApiStatus("אנא הכנס מפתח API", "error")
      return
    }

    this.validateApiBtn.disabled = true
    this.validateApiBtn.textContent = "בודק..."

    this.validateApiKey(apiKey).then(() => {
      this.closeModals()
    }).catch(error => {
      console.error("[ChromeGenie] Error during validation:", error)
      this.showApiStatus("מפתח לא תקין ✗: " + error.message, "error")
    }).finally(() => {
      this.validateApiBtn.disabled = false
      this.validateApiBtn.textContent = "שמור"
    })
  }

  async validateApiKey(apiKey) {
    console.log("[ChromeGenie] Starting API key validation...")
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.settings.model}:generateContent?key=${apiKey}`,
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
          generationConfig: {
            temperature: this.settings.temperature,
            topP: this.settings.top_p,
            topK: this.settings.top_k,
            maxOutputTokens: this.settings.max_tokens
          }
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
      alert("אנא הגדר מפתח API תקין בחלונית ההגדרות")
      return
    }

    this.chatHistory = []
    this.chatHistory.push({ role: "user", content: idea })
    const chatName = idea.length > 20 ? idea.substring(0, 20) + "..." : idea
    this.currentChatId = Date.now().toString()
    this.chats.push({ id: this.currentChatId, name: chatName, history: [...this.chatHistory], favorite: false })
    localStorage.setItem("genie_chats", JSON.stringify(this.chats))
    this.renderChat()
    this.outputSection.style.display = "block"
    this.outputSection.scrollIntoView({ behavior: "smooth" })

    this.setGenerateButtonLoading(true)

    try {
      const response = await this.callGeminiAPI()
      this.chatHistory.push({ role: "model", content: response })
      this.chats.find(c => c.id === this.currentChatId).history = [...this.chatHistory]
      localStorage.setItem("genie_chats", JSON.stringify(this.chats))
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
    if (!message || !this.currentChatId) return

    this.chatHistory.push({ role: "user", content: message })
    this.renderChat()
    this.followUpInput.value = ""
    this.sendFollowUpBtn.disabled = true

    try {
      const response = await this.callGeminiAPI()
      this.chatHistory.push({ role: "model", content: response })
      this.chats.find(c => c.id === this.currentChatId).history = [...this.chatHistory]
      localStorage.setItem("genie_chats", JSON.stringify(this.chats))
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
    contents.unshift({ parts: [{ text: basePrompt }] })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.settings.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.settings.temperature,
            topP: this.settings.top_p,
            topK: this.settings.top_k,
            maxOutputTokens: this.settings.max_tokens
          }
        }),
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

  renderHistoryList() {
    this.historyList.innerHTML = ""
    this.chats.forEach(chat => {
      const item = document.createElement("div")
      item.className = "history-item"
      item.innerHTML = `
        <span class="preview">${chat.name}</span>
        <div>
          <button class="favorite-btn" data-id="${chat.id}" data-fav="${chat.favorite}">${chat.favorite ? "★" : "☆"}</button>
          <button class="delete-btn" data-id="${chat.id}">×</button>
        </div>
      `
      item.addEventListener("click", () => this.loadChat(chat.id))
      item.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleFavorite(chat.id)
      })
      item.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation()
        this.deleteChat(chat.id)
      })
      this.historyList.appendChild(item)
    })
  }

  toggleFavorite(chatId) {
    const chat = this.chats.find(c => c.id === chatId)
    if (chat) {
      chat.favorite = !chat.favorite
      localStorage.setItem("genie_chats", JSON.stringify(this.chats))
      this.renderHistoryList()
    }
  }

  deleteChat(chatId) {
    this.chats = this.chats.filter(c => c.id !== chatId)
    if (this.currentChatId === chatId) {
      this.chatHistory = []
      this.currentChatId = null
      this.renderChat()
    }
    localStorage.setItem("genie_chats", JSON.stringify(this.chats))
    this.renderHistoryList()
  }

  loadChat(chatId) {
    const chat = this.chats.find(c => c.id === chatId)
    if (chat) {
      this.currentChatId = chatId
      this.chatHistory = [...chat.history]
      this.renderChat()
      this.closeModals()
      this.outputSection.style.display = "block"
    }
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
