class ChromeGenie {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = localStorage.getItem("api_key_valid") === "true"
    this.settings = this.loadSettings()
    this.chats = this.loadChats()
    this.currentChat = null
    this.currentFiles = {}
    this.activeFile = null

    setTimeout(() => {
      this.initializeElements()
      this.bindEvents()
      this.loadSavedApiKey()
    }, 100)
  }

  loadSettings() {
    const defaultSettings = {
      model: "gemini-1.5-flash", // שינוי המודל البرירת מחדל ל-1.5
      temperature: 0.7,
      maxTokens: 4096,
      unlimitedTokens: false,
      topP: 0.95,
      topK: 40,
      responseLanguage: "hebrew",
      autoSaveChats: true,
      darkMode: false,
      showAdvancedOptions: false,
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
    this.unlimitedTokens = document.getElementById("unlimitedTokens")
    this.topPSlider = document.getElementById("topPSlider")
    this.topPValue = document.getElementById("topPValue")
    this.topKSlider = document.getElementById("topKSlider")
    this.topKValue = document.getElementById("topKValue")
    this.responseLanguage = document.getElementById("responseLanguage")
    this.autoSaveChats = document.getElementById("autoSaveChats")
    this.darkMode = document.getElementById("darkMode")
    this.showAdvancedOptions = document.getElementById("showAdvancedOptions")
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn")
    this.resetSettingsBtn = document.getElementById("resetSettingsBtn")

    this.chatsList = document.getElementById("chatsList")
    this.allChatsBtn = document.getElementById("allChatsBtn")
    this.favoriteChatsBtn = document.getElementById("favoriteChatsBtn")
  }

  bindEvents() {
    if (this.generateBtn) {
      this.generateBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.generateExtension()
      })
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.downloadExtension()
      })
    }

    if (this.historyBtn) {
      this.historyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("[v0] Opening modal: historyModal")
        this.openModal("historyModal")
      })
    }

    if (this.apiKeyBtn) {
      this.apiKeyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("[v0] Opening modal: apiKeyModal")
        this.openModal("apiKeyModal")
      })
    }

    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("[v0] Opening modal: settingsModal")
        this.openModal("settingsModal")
      })
    }

    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.closeModal(e.target.dataset.modal)
      })
    })

    if (this.saveApiKeyBtn) {
      this.saveApiKeyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.validateAndSaveApiKey()
      })
    }

    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener("input", () => this.onApiKeyChange())
    }

    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.saveUserSettings()
      })
    }

    if (this.resetSettingsBtn) {
      this.resetSettingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.resetSettings()
      })
    }

    this.temperatureSlider.addEventListener("input", (e) => {
      this.temperatureValue.textContent = e.target.value
    })

    this.topPSlider.addEventListener("input", (e) => {
      this.topPValue.textContent = e.target.value
    })

    this.topKSlider.addEventListener("input", (e) => {
      this.topKValue.textContent = e.target.value
    })

    this.unlimitedTokens.addEventListener("change", (e) => {
      this.maxTokensInput.disabled = e.target.checked
      if (e.target.checked) {
        this.maxTokensInput.value = ""
        this.maxTokensInput.placeholder = "ללא הגבלה"
      } else {
        this.maxTokensInput.value = 4096
        this.maxTokensInput.placeholder = ""
      }
    })

    this.allChatsBtn.addEventListener("click", () => this.showAllChats())
    this.favoriteChatsBtn.addEventListener("click", () => this.showFavoriteChats())

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.preventDefault()
        this.closeModal(e.target.id)
      }
    })
  }

  openModal(modalId) {
    console.log("[v0] Opening modal:", modalId)
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = "block"

      if (modalId === "apiKeyModal") {
        this.loadApiKeyModal()
      } else if (modalId === "settingsModal") {
        this.loadSettingsModal()
      } else if (modalId === "historyModal") {
        this.loadHistoryModal()
      }
    } else {
      console.error("[v0] Modal not found:", modalId)
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
    this.unlimitedTokens.checked = this.settings.unlimitedTokens
    this.topPSlider.value = this.settings.topP
    this.topPValue.textContent = this.settings.topP
    this.topKSlider.value = this.settings.topK
    this.topKValue.textContent = this.settings.topK
    this.responseLanguage.value = this.settings.responseLanguage
    this.autoSaveChats.checked = this.settings.autoSaveChats
    this.darkMode.checked = this.settings.darkMode
    this.showAdvancedOptions.checked = this.settings.showAdvancedOptions

    this.maxTokensInput.disabled = this.settings.unlimitedTokens
    if (this.settings.unlimitedTokens) {
      this.maxTokensInput.placeholder = "ללא הגבלה"
    }
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
      const testModel = "gemini-1.5-flash" // שימוש במודל יציב לבדיקה
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`,
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
      console.error("[v0] API key validation error:", error)
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
    this.settings.maxTokens = this.unlimitedTokens.checked ? null : Number.parseInt(this.maxTokensInput.value)
    this.settings.unlimitedTokens = this.unlimitedTokens.checked
    this.settings.topP = Number.parseFloat(this.topPSlider.value)
    this.settings.topK = Number.parseInt(this.topKSlider.value)
    this.settings.responseLanguage = this.responseLanguage.value
    this.settings.autoSaveChats = this.autoSaveChats.checked
    this.settings.darkMode = this.darkMode.checked
    this.settings.showAdvancedOptions = this.showAdvancedOptions.checked

    this.saveSettings()

    this.saveSettingsBtn.textContent = "נשמר ✓"
    setTimeout(() => {
      this.saveSettingsBtn.textContent = "שמור הגדרות"
    }, 2000)
  }

  resetSettings() {
    if (confirm("האם אתה בטוח שברצונך לאפס את כל ההגדרות?")) {
      localStorage.removeItem("chromegenie_settings")
      this.settings = this.loadSettings()
      this.loadSettingsModal()

      this.resetSettingsBtn.textContent = "אופס ✓"
      setTimeout(() => {
        this.resetSettingsBtn.textContent = "איפוס הגדרות"
      }, 2000)
    }
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
    const languagePrompt =
      this.settings.responseLanguage === "hebrew"
        ? "אנא ענה בעברית בלבד."
        : this.settings.responseLanguage === "english"
          ? "Please respond in English only."
          : ""

    const prompt = `${languagePrompt}\nצור תוסף Chrome מלא ופונקציונלי על בסיס הרעיון: "${idea}"\n\nאנא צור את הקבצים הבאים עם קוד מלא ומוכן לשימוש:\n\n1. manifest.json - עם Manifest V3\n2. popup.html - ממשק משתמש נקי ופונקציונלי\n3. popup.js - כל הלוגיקה הנדרשת\n4. styles.css - עיצוב יפה ומודרני\n\nדרישות:\n- השתמש ב-Manifest V3 בלבד\n- קוד נקי וקריא עם הערות בעברית\n- ממשק משתמש פשוט ואינטואיטיבי\n- פונקציונליות מלאה ומוכנה לשימוש\n- עיצוב מודרני ונעים לעין\n\nהצג את הקבצים בפורמט הבא:\n=== manifest.json ===\n[קוד]\n\n=== popup.html ===\n[קוד]\n\n=== popup.js ===\n[קוד]\n\n=== styles.css ===\n[קוד]`

    const generationConfig = {
      temperature: this.settings.temperature,
      topP: this.settings.topP,
      topK: this.settings.topK,
    }

    if (!this.settings.unlimitedTokens && this.settings.maxTokens) {
      generationConfig.maxOutputTokens = this.settings.maxTokens
    }

    let modelToUse = this.settings.model
    if (modelToUse === "gemini-2.5-flash-exp") {
      // אם המודל החדש לא זמין, נשתמש במודל יציב
      modelToUse = "gemini-1.5-flash"
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`,
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
          generationConfig,
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] API Error:", errorData)
      throw new Error(errorData.error?.message || "שגיאה בקריאה ל-API של Gemini")
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  displayAIResponse(response) {
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
      .join("\n")

    this.aiResponseContent.textContent = aiResponse || "התוסף נוצר בהצלחה!"
  }

  parseAndDisplayCode(code) {
    this.currentFiles = this.parseGeneratedCode(code)
    this.renderFileTabs()

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
    document.querySelectorAll(".file-tab").forEach((tab) => {
      tab.classList.remove("active")
      if (tab.textContent === filename) {
        tab.classList.add("active")
      }
    })

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

const script = document.createElement("script")
script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
script.onload = () => {
  console.log("[v0] JSZip loaded successfully")
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("[v0] DOM loaded, initializing ChromeGenie")
      window.chromegenie = new ChromeGenie()
    })
  } else {
    console.log("[v0] DOM already loaded, initializing ChromeGenie")
    window.chromegenie = new ChromeGenie()
  }
}
script.onerror = () => {
  console.error("[v0] Failed to load JSZip library")
  alert("שגיאה בטעינת ספריית JSZip. אנא רענן את הדף.")
}
document.head.appendChild(script)
