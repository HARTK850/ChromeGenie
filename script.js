class ChromeGenie {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = localStorage.getItem("api_key_valid") === "true"
    this.settings = this.loadSettings()
    this.chats = this.loadChats()
    this.currentChat = null
    this.currentFiles = {}
    this.activeFile = null

    this.initializeElements()
    this.bindEvents()
    this.loadSavedApiKey()
  }

  loadSettings() {
    const defaultSettings = {
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
      maxTokens: 4096,
      autoSaveChats: true,
    }
    const saved = localStorage.getItem("chromegenie_settings")
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  }

  loadChats() {
    const saved = localStorage.getItem("chromegenie_chats")
    return saved ? JSON.parse(saved) : []
  }

  saveSettings() {
    localStorage.setItem("chromegenie_settings", JSON.stringify(this.settings))
  }

  saveChats() {
    localStorage.setItem("chromegenie_chats", JSON.stringify(this.chats))
  }

  initializeElements() {
    this.ideaInput = document.getElementById("ideaInput")
    this.generateBtn = document.getElementById("generateBtn")
    this.btnText = document.querySelector(".btn-text")
    this.btnLoader = document.querySelector(".btn-loader")

    this.aiResponseSection = document.getElementById("aiResponseSection")
    this.aiResponseContent = document.getElementById("aiResponseContent")
    this.codeEditorSection = document.getElementById("codeEditorSection")
    this.fileTabs = document.getElementById("fileTabs")
    this.codeContent = document.getElementById("codeContent")
    this.downloadBtn = document.getElementById("downloadBtn")

    this.historyBtn = document.getElementById("historyBtn")
    this.apiKeyBtn = document.getElementById("apiKeyBtn")
    this.settingsBtn = document.getElementById("settingsBtn")

    this.historyModal = document.getElementById("historyModal")
    this.apiKeyModal = document.getElementById("apiKeyModal")
    this.settingsModal = document.getElementById("settingsModal")

    this.apiKeyInput = document.getElementById("apiKeyInput")
    this.saveApiKeyBtn = document.getElementById("saveApiKeyBtn")
    this.apiStatus = document.getElementById("apiStatus")

    this.modelSelect = document.getElementById("modelSelect")
    this.temperatureSlider = document.getElementById("temperatureSlider")
    this.temperatureValue = document.getElementById("temperatureValue")
    this.maxTokensInput = document.getElementById("maxTokensInput")
    this.autoSaveChats = document.getElementById("autoSaveChats")
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn")

    this.chatsList = document.getElementById("chatsList")
    this.allChatsBtn = document.getElementById("allChatsBtn")
    this.favoriteChatsBtn = document.getElementById("favoriteChatsBtn")
  }

  bindEvents() {
    this.generateBtn.addEventListener("click", () => this.generateExtension())
    this.downloadBtn.addEventListener("click", () => this.downloadExtension())

    this.historyBtn.addEventListener("click", () => this.openModal("historyModal"))
    this.apiKeyBtn.addEventListener("click", () => this.openModal("apiKeyModal"))
    this.settingsBtn.addEventListener("click", () => this.openModal("settingsModal"))

    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.closeModal(e.target.dataset.modal)
      })
    })

    this.saveApiKeyBtn.addEventListener("click", () => this.validateAndSaveApiKey())
    this.apiKeyInput.addEventListener("input", () => this.onApiKeyChange())

    this.saveSettingsBtn.addEventListener("click", () => this.saveUserSettings())
    this.temperatureSlider.addEventListener("input", (e) => {
      this.temperatureValue.textContent = e.target.value
    })

    this.allChatsBtn.addEventListener("click", () => this.showAllChats())
    this.favoriteChatsBtn.addEventListener("click", () => this.showFavoriteChats())

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target.id)
      }
    })
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId)
    modal.style.display = "block"

    if (modalId === "apiKeyModal") {
      this.loadApiKeyModal()
    } else if (modalId === "settingsModal") {
      this.loadSettingsModal()
    } else if (modalId === "historyModal") {
      this.loadHistoryModal()
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    modal.style.display = "none"
  }

  loadApiKeyModal() {
    this.apiKeyInput.value = this.apiKey
    if (this.isApiKeyValid) {
      this.showApiStatus("מפתח תקין ✓", "success")
    } else {
      this.apiStatus.textContent = ""
      this.apiStatus.className = "api-status"
    }
  }

  loadSettingsModal() {
    this.modelSelect.value = this.settings.model
    this.temperatureSlider.value = this.settings.temperature
    this.temperatureValue.textContent = this.settings.temperature
    this.maxTokensInput.value = this.settings.maxTokens
    this.autoSaveChats.checked = this.settings.autoSaveChats
  }

  loadHistoryModal() {
    this.renderChatsList()
  }

  loadSavedApiKey() {}

  onApiKeyChange() {
    this.isApiKeyValid = false
    localStorage.removeItem("api_key_valid")
    this.apiStatus.textContent = ""
    this.apiStatus.className = "api-status"
  }

  async validateAndSaveApiKey() {
    const apiKey = this.apiKeyInput.value.trim()

    if (!apiKey) {
      this.showApiStatus("אנא הכנס מפתח API", "error")
      return
    }

    this.saveApiKeyBtn.disabled = true
    this.saveApiKeyBtn.textContent = "בודק..."

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${apiKey}`,
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
        this.apiKey = apiKey
        this.isApiKeyValid = true
        localStorage.setItem("gemini_api_key", apiKey)
        localStorage.setItem("api_key_valid", "true")
        this.showApiStatus("מפתח נשמר בהצלחה ✓", "success")
      } else {
        throw new Error("מפתח לא תקין")
      }
    } catch (error) {
      this.showApiStatus("מפתח לא תקין ✗", "error")
      this.isApiKeyValid = false
      localStorage.removeItem("api_key_valid")
    } finally {
      this.saveApiKeyBtn.disabled = false
      this.saveApiKeyBtn.textContent = "שמור מפתח"
    }
  }

  showApiStatus(message, type) {
    this.apiStatus.textContent = message
    this.apiStatus.className = `api-status ${type}`
  }

  saveUserSettings() {
    this.settings.model = this.modelSelect.value
    this.settings.temperature = Number.parseFloat(this.temperatureSlider.value)
    this.settings.maxTokens = Number.parseInt(this.maxTokensInput.value)
    this.settings.autoSaveChats = this.autoSaveChats.checked

    this.saveSettings()

    this.saveSettingsBtn.textContent = "נשמר ✓"
    setTimeout(() => {
      this.saveSettingsBtn.textContent = "שמור הגדרות"
    }, 2000)
  }

  async generateExtension() {
    const idea = this.ideaInput.value.trim()

    if (!idea) {
      alert("אנא תאר את הרעיון שלך לתוסף")
      return
    }

    if (!this.isApiKeyValid) {
      alert("אנא הגדר ושמור את מפתח ה-API תחילה")
      return
    }

    this.setGenerateButtonLoading(true)

    try {
      const response = await this.callGeminiAPI(idea)

      this.displayAIResponse(response)
      this.parseAndDisplayCode(response)

      if (this.settings.autoSaveChats) {
        this.saveCurrentChat(idea, response)
      }

      this.aiResponseSection.style.display = "block"
      this.codeEditorSection.style.display = "block"
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("[v0] Error generating extension:", error)
      alert("שגיאה ביצירת התוסף: " + error.message)
    } finally {
      this.setGenerateButtonLoading(false)
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

  async callGeminiAPI(idea) {
    const prompt = `צור תוסף כרום מלא ופונקציונלי על בסיס הרעיון: "${idea}"

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.apiKey}`,
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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.settings.temperature,
            maxOutputTokens: this.settings.maxTokens,
          },
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

  displayAIResponse(response) {
    // חילוץ החלק הטקסטואלי מהתשובה (לא הקוד)
    const lines = response.split("\n")
    const aiResponse = lines
      .filter(
        (line) =>
          !line.startsWith("===") &&
          !line.includes("manifest.json") &&
          !line.includes("popup.html") &&
          !line.includes("popup.js") &&
          !line.includes("styles.css") &&
          line.trim() !== "",
      )
      .slice(0, 10)
      .join("\n") // לוקח רק את השורות הראשונות

    this.aiResponseContent.textContent = aiResponse || "התוסף נוצר בהצלחה!"
  }

  parseAndDisplayCode(code) {
    this.currentFiles = this.parseGeneratedCode(code)
    this.renderFileTabs()

    // הצגת הקובץ הראשון
    const firstFile = Object.keys(this.currentFiles)[0]
    if (firstFile) {
      this.showFile(firstFile)
    }
  }

  renderFileTabs() {
    this.fileTabs.innerHTML = ""

    Object.keys(this.currentFiles).forEach((filename) => {
      const tab = document.createElement("button")
      tab.className = "file-tab"
      tab.textContent = filename
      tab.addEventListener("click", () => this.showFile(filename))
      this.fileTabs.appendChild(tab)
    })
  }

  showFile(filename) {
    // עדכון טאבים
    document.querySelectorAll(".file-tab").forEach((tab) => {
      tab.classList.remove("active")
      if (tab.textContent === filename) {
        tab.classList.add("active")
      }
    })

    // הצגת תוכן הקובץ
    this.activeFile = filename
    this.codeContent.textContent = this.currentFiles[filename] || ""
  }

  saveCurrentChat(idea, response) {
    const chatTitle = this.generateChatTitle(idea)
    const chat = {
      id: Date.now(),
      title: chatTitle,
      idea: idea,
      response: response,
      files: this.currentFiles,
      date: new Date().toISOString(),
      favorite: false,
    }

    this.chats.unshift(chat)
    this.saveChats()
  }

  generateChatTitle(idea) {
    // יצירת כותרת חכמה לצ'אט על בסיס הרעיון
    const words = idea.split(" ").slice(0, 4)
    return words.join(" ") + (idea.split(" ").length > 4 ? "..." : "")
  }

  renderChatsList(showFavorites = false) {
    const chatsToShow = showFavorites ? this.chats.filter((chat) => chat.favorite) : this.chats

    if (chatsToShow.length === 0) {
      this.chatsList.innerHTML = '<div class="empty-state">אין צ\'אטים שמורים עדיין</div>'
      return
    }

    this.chatsList.innerHTML = chatsToShow
      .map(
        (chat) => `
      <div class="chat-item ${chat.favorite ? "favorite" : ""}" data-chat-id="${chat.id}">
        <div class="chat-actions">
          <button class="chat-action-btn" onclick="chromegenie.toggleFavorite(${chat.id})">
            ${chat.favorite ? "⭐" : "☆"}
          </button>
          <button class="chat-action-btn" onclick="chromegenie.deleteChat(${chat.id})">
            🗑️
          </button>
        </div>
        <div class="chat-title">${chat.title}</div>
        <div class="chat-preview">${chat.idea.substring(0, 100)}...</div>
        <div class="chat-date">${new Date(chat.date).toLocaleDateString("he-IL")}</div>
      </div>
    `,
      )
      .join("")

    // הוספת אירועים לפתיחת צ'אטים
    document.querySelectorAll(".chat-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("chat-action-btn")) {
          const chatId = Number.parseInt(item.dataset.chatId)
          this.loadChat(chatId)
        }
      })
    })
  }

  showAllChats() {
    this.allChatsBtn.classList.add("active")
    this.favoriteChatsBtn.classList.remove("active")
    this.renderChatsList(false)
  }

  showFavoriteChats() {
    this.favoriteChatsBtn.classList.add("active")
    this.allChatsBtn.classList.remove("active")
    this.renderChatsList(true)
  }

  toggleFavorite(chatId) {
    const chat = this.chats.find((c) => c.id === chatId)
    if (chat) {
      chat.favorite = !chat.favorite
      this.saveChats()
      this.renderChatsList(this.favoriteChatsBtn.classList.contains("active"))
    }
  }

  deleteChat(chatId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את הצ'אט הזה?")) {
      this.chats = this.chats.filter((c) => c.id !== chatId)
      this.saveChats()
      this.renderChatsList(this.favoriteChatsBtn.classList.contains("active"))
    }
  }

  loadChat(chatId) {
    const chat = this.chats.find((c) => c.id === chatId)
    if (chat) {
      this.ideaInput.value = chat.idea
      this.currentFiles = chat.files
      this.displayAIResponse(chat.response)
      this.renderFileTabs()

      const firstFile = Object.keys(this.currentFiles)[0]
      if (firstFile) {
        this.showFile(firstFile)
      }

      this.aiResponseSection.style.display = "block"
      this.codeEditorSection.style.display = "block"
      this.closeModal("historyModal")
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  downloadExtension() {
    try {
      this.createAndDownloadZip(this.currentFiles)
    } catch (error) {
      console.error("[v0] Download failed:", error)
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
  window.JSZip = window.JSZip || {}
  document.addEventListener("DOMContentLoaded", () => {
    window.chromegenie = new ChromeGenie()
  })
}
document.head.appendChild(script)
