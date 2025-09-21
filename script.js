class ChroboAi {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = false
    this.isGenerating = false
    this.currentFiles = {}
    this.selectedText = ""
    this.currentFileTab = ""
    this.chatHistory = JSON.parse(localStorage.getItem("chat_history")) || []

    this.settings = {
      model: localStorage.getItem("ai_model") || "gemini-2.5-flash",
      temperature: Number.parseFloat(localStorage.getItem("ai_temperature")) || 0.7,
      maxTokens: Number.parseInt(localStorage.getItem("ai_max_tokens")) || 4096,
      unlimitedTokens: localStorage.getItem("ai_unlimited_tokens") === "true",
      topP: Number.parseFloat(localStorage.getItem("ai_top_p")) || 0.95,
      topK: Number.parseInt(localStorage.getItem("ai_top_k")) || 40,
      autoSaveChats: localStorage.getItem("auto_save_chats") !== "false",
    }

    this.initializeElements()
    this.bindEvents()
    this.validateApiKey()
    this.loadSettings()
  }

  initializeElements() {
    this.ideaInput = document.getElementById("ideaInput")
    this.generateBtn = document.getElementById("generateBtn")
    this.aiResponseSection = document.getElementById("aiResponseSection")
    this.aiResponseContent = document.getElementById("aiResponseContent")
    this.codeEditorSection = document.getElementById("codeEditorSection")
    this.codeEditor = document.getElementById("codeEditor")
    this.codeContent = document.getElementById("codeContent")
    this.fileTabs = document.getElementById("fileTabs")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.continueChatSection = document.getElementById("continueChatSection")
    this.continueInput = document.getElementById("continueInput")
    this.continueBtn = document.getElementById("continueBtn")
    this.saveNotification = document.getElementById("saveNotification")

    this.historyBtn = document.getElementById("historyBtn")
    this.apiKeyBtn = document.getElementById("apiKeyBtn")
    this.settingsBtn = document.getElementById("settingsBtn")

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
    this.autoSaveChats = document.getElementById("autoSaveChats")
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn")

    this.chatsList = document.getElementById("chatsList")
    this.allChatsBtn = document.getElementById("allChatsBtn")
    this.favoriteChatsBtn = document.getElementById("favoriteChatsBtn")

    this.textSelectionPopup = document.getElementById("textSelectionPopup")
    this.askAboutSelectionBtn = document.getElementById("askAboutSelectionBtn")
    this.selectedTextContext = document.getElementById("selectedTextContext")
    this.selectedTextDisplay = document.getElementById("selectedTextDisplay")
  }

  bindEvents() {
    this.generateBtn.addEventListener("click", () => this.generateExtension())
    this.downloadBtn.addEventListener("click", () => this.downloadExtension())
    this.continueBtn.addEventListener("click", () => this.continueChat())

    this.historyBtn.addEventListener("click", () => this.openModal("historyModal"))
    this.apiKeyBtn.addEventListener("click", () => this.openModal("apiKeyModal"))
    this.settingsBtn.addEventListener("click", () => this.openModal("settingsModal"))

    this.saveApiKeyBtn.addEventListener("click", () => this.saveApiKey())
    this.saveSettingsBtn.addEventListener("click", () => this.saveSettings())

    this.temperatureSlider.addEventListener("input", (e) => {
      this.temperatureValue.textContent = e.target.value
    })
    this.topPSlider.addEventListener("input", (e) => {
      this.topPValue.textContent = e.target.value
    })
    this.topKSlider.addEventListener("input", (e) => {
      this.topKValue.textContent = e.target.value
    })

    this.allChatsBtn.addEventListener("click", () => this.filterChats("all"))
    this.favoriteChatsBtn.addEventListener("click", () => this.filterChats("favorites"))

    document.addEventListener("mouseup", (e) => this.handleTextSelection(e))
    this.askAboutSelectionBtn.addEventListener("click", () => this.askAboutSelection())

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("close-btn")) {
        this.closeModal(e.target.dataset.modal)
      }
      if (e.target.classList.contains("modal") && !e.target.querySelector(".modal-content").contains(e.target)) {
        this.closeModal(e.target.id)
      }
    })

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        this.saveCurrentCode()
      }
    })

    this.ideaInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.generateExtension()
      }
    })

    this.continueInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.continueChat()
      }
    })
  }

  saveCurrentCode() {
    if (Object.keys(this.currentFiles).length === 0) {
      return
    }

    // Update current file content if editing
    if (this.currentFileTab && this.codeContent.textContent) {
      this.currentFiles[this.currentFileTab] = this.codeContent.textContent
    }

    // Show save notification
    this.saveNotification.style.display = "block"
    setTimeout(() => {
      this.saveNotification.style.display = "none"
    }, 3000)

    console.log("[v0] Files saved:", this.currentFiles)
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = "flex"
      if (modalId === "historyModal") {
        this.loadChatHistory()
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = "none"
    }
  }

  async validateApiKey() {
    if (!this.apiKey) {
      this.isApiKeyValid = false
      return
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        },
      )

      this.isApiKeyValid = response.ok
      this.updateApiStatus()
    } catch (error) {
      console.error("[v0] API validation error:", error)
      this.isApiKeyValid = false
      this.updateApiStatus()
    }
  }

  updateApiStatus() {
    if (this.apiStatus) {
      if (this.isApiKeyValid) {
        this.apiStatus.innerHTML = '<span style="color: #4CAF50;">✓ מפתח תקין</span>'
      } else if (this.apiKey) {
        this.apiStatus.innerHTML = '<span style="color: #f44336;">✗ מפתח לא תקין</span>'
      } else {
        this.apiStatus.innerHTML = '<span style="color: #ff9800;">⚠ לא הוגדר מפתח</span>'
      }
    }
  }

  saveApiKey() {
    const newApiKey = this.apiKeyInput.value.trim()
    if (newApiKey) {
      this.apiKey = newApiKey
      localStorage.setItem("gemini_api_key", this.apiKey)
      this.validateApiKey()
      this.closeModal("apiKeyModal")
      this.apiKeyInput.value = ""
    }
  }

  loadSettings() {
    this.modelSelect.value = this.settings.model
    this.temperatureSlider.value = this.settings.temperature
    this.temperatureValue.textContent = this.settings.temperature
    this.maxTokensInput.value = this.settings.maxTokens
    this.unlimitedTokens.checked = this.settings.unlimitedTokens
    this.topPSlider.value = this.settings.topP
    this.topPValue.textContent = this.settings.topP
    this.topKSlider.value = this.settings.topK
    this.topKValue.textContent = this.settings.topK
    this.autoSaveChats.checked = this.settings.autoSaveChats
  }

  saveSettings() {
    this.settings.model = this.modelSelect.value
    this.settings.temperature = Number.parseFloat(this.temperatureSlider.value)
    this.settings.maxTokens = Number.parseInt(this.maxTokensInput.value)
    this.settings.unlimitedTokens = this.unlimitedTokens.checked
    this.settings.topP = Number.parseFloat(this.topPSlider.value)
    this.settings.topK = Number.parseInt(this.topKSlider.value)
    this.settings.autoSaveChats = this.autoSaveChats.checked

    localStorage.setItem("ai_model", this.settings.model)
    localStorage.setItem("ai_temperature", this.settings.temperature)
    localStorage.setItem("ai_max_tokens", this.settings.maxTokens)
    localStorage.setItem("ai_unlimited_tokens", this.settings.unlimitedTokens)
    localStorage.setItem("ai_top_p", this.settings.topP)
    localStorage.setItem("ai_top_k", this.settings.topK)
    localStorage.setItem("auto_save_chats", this.settings.autoSaveChats)

    this.closeModal("settingsModal")
    alert("ההגדרות נשמרו בהצלחה!")
  }

  setGenerateButtonLoading(loading) {
    const btnText = this.generateBtn.querySelector(".btn-text")
    const btnLoader = this.generateBtn.querySelector(".btn-loader")

    if (loading) {
      btnText.style.display = "none"
      btnLoader.style.display = "inline-flex"
      this.generateBtn.disabled = true
    } else {
      btnText.style.display = "inline"
      btnLoader.style.display = "none"
      this.generateBtn.disabled = false
    }
  }

  setContinueButtonLoading(loading) {
    const continueText = this.continueBtn.querySelector(".continue-text")
    const continueLoader = this.continueBtn.querySelector(".continue-loader")

    if (loading) {
      continueText.style.display = "none"
      continueLoader.style.display = "inline-flex"
      this.continueBtn.disabled = true
    } else {
      continueText.style.display = "inline"
      continueLoader.style.display = "none"
      this.continueBtn.disabled = false
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

    this.isGenerating = true
    this.setGenerateButtonLoading(true)

    try {
      const response = await this.callGeminiAPI(idea)

      if (!this.isGenerating) return

      this.displayAIResponse(response)
      this.parseAndDisplayCode(response)

      if (this.settings.autoSaveChats) {
        this.saveCurrentChat(idea, response)
      }

      this.aiResponseSection.style.display = "block"
      this.codeEditorSection.style.display = "block"
      this.continueChatSection.style.display = "block"
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("[v0] Error generating extension:", error)
      alert("שגיאה ביצירת התוסף: " + error.message)
    } finally {
      this.isGenerating = false
      this.setGenerateButtonLoading(false)
    }
  }

  async callGeminiAPI(idea, isContinuation = false, previousContext = "") {
    let prompt
    if (isContinuation) {
      prompt = `אתה Chrobo Ai - מומחה ליצירת תוספי Chrome מתקדמים ופונקציונליים.

הקשר הקודם: ${previousContext}

בקשת המשתמש החדשה: ${idea}

אנא ספק תשובה מפורטת ומעוצבת יפה עם הוראות ברורות. אל תכלול קוד בתשובה - הקוד יוצג בעורך נפרד.

אם יש צורך בשינויי קוד, ספק את הקבצים המעודכנים בפורמט הבא:
=== שם_קובץ ===
תוכן הקובץ
=== סוף_קובץ ===`
    } else {
      prompt = `אתה Chrobo Ai - מומחה ליצירת תוספי Chrome מתקדמים ופונקציונליים.

המשתמש רוצה ליצור תוסף Chrome עם הרעיון הבא: "${idea}"

אנא צור תוסף Chrome מלא ופונקציונלי עם Manifest V3. 

חשוב מאוד:
1. אל תכלול קוד בתשובה שלך - הקוד יוצג בעורך נפרד
2. בתשובה כלול רק: סיכום מה יצרת, הוראות התקנה, ורעיונות להמשך פיתוח
3. הקוד צריך להיות בפורמט הבא:

=== manifest.json ===
{
  "manifest_version": 3,
  "name": "שם התוסף",
  "version": "1.0",
  "description": "תיאור התוסף",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["activeTab"]
}
=== סוף_קובץ ===

=== popup.html ===
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- HTML content -->
    <script src="popup.js"></script>
</body>
</html>
=== סוף_קובץ ===

=== popup.js ===
// JavaScript code
=== סוף_קובץ ===

=== styles.css ===
/* CSS styles */
=== סוף_קובץ ===

דרישות:
- השתמש ב-Manifest V3 בלבד
- קוד נקי עם הערות בעברית
- ממשק משתמש אינטואיטיבי
- פונקציונליות מלאה
- עיצוב מודרני ונעים`
    }

    const generationConfig = {
      temperature: this.settings.temperature,
      topP: this.settings.topP,
      topK: this.settings.topK,
    }

    if (!this.settings.unlimitedTokens && this.settings.maxTokens) {
      generationConfig.maxOutputTokens = this.settings.maxTokens
    }

    let modelToUse = this.settings.model
    if (modelToUse === "gemini-2.5-flash" || modelToUse === "gemini-2.5-flash-exp") {
      try {
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "test" }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          },
        )
        if (!testResponse.ok) {
          modelToUse = "gemini-1.5-flash"
        }
      } catch {
        modelToUse = "gemini-1.5-flash"
      }
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
    const cleanResponse = response
      .replace(/===[\s\S]*?===/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^(\d+\.|-|•)\s/gm, "• ")
      .replace(/\n\n+/g, "\n\n")
      .trim()

    const lines = cleanResponse
      .split("\n")
      .filter(
        (line) =>
          line.trim() !== "" &&
          !line.includes("chrome://extensions") &&
          !line.includes("manifest.json") &&
          !line.includes("popup.html") &&
          !line.includes("popup.js") &&
          !line.includes("styles.css") &&
          !line.includes("=== "),
      )

    const finalResponse = lines.slice(0, 25).join("\n")

    this.aiResponseContent.innerHTML =
      finalResponse ||
      `
      <strong>בשמחה! יצרתי עבורך תוסף Chrome מלא ופונקציונלי!</strong><br><br>
      
      <strong>הוראות התקנה:</strong><br>
      • הורד את קובץ ה-ZIP<br>
      • פתח את דף התוספים בכרום (chrome://extensions)<br>
      • הפעל מצב מפתח (Developer mode)<br>
      • גרור את קובץ ה-ZIP לדף התוספים<br>
      • התוסף יותקן אוטומטית!<br><br>
      
      <strong>רעיונות להמשך פיתוח:</strong><br>
      • הוספת אפשרויות התאמה אישית נוספות<br>
      • שיפור הביצועים והמהירות<br>
      • הוספת תמיכה בשפות נוספות<br>
      • יצירת ממשק משתמש מתקדם יותר<br><br>
      
      <strong>💡 טיפ:</strong> השתמש ב-Ctrl+S כדי לשמור שינויים בעורך הקוד
    `
  }

  parseAndDisplayCode(code) {
    this.currentFiles = this.parseGeneratedCode(code)
    this.renderFileTabs()

    const firstFile = Object.keys(this.currentFiles)[0]
    if (firstFile) {
      this.showFile(firstFile)
    }
  }

  parseGeneratedCode(code) {
    const files = {}

    // Primary pattern: === filename === content === סוף_קובץ ===
    const primaryPattern = /===\s*([^=]+?)\s*===\s*([\s\S]*?)(?:===\s*סוף_קובץ\s*===|===\s*[^=]+?\s*===|$)/g
    let match

    while ((match = primaryPattern.exec(code)) !== null) {
      const fileName = match[1].trim()
      let fileContent = match[2].trim()

      // Clean up content
      fileContent = fileContent
        .replace(/^```[\w]*\n?/gm, "")
        .replace(/\n?```$/gm, "")
        .replace(/^---.*$/gm, "")
        .replace(/===\s*סוף_קובץ\s*===/g, "")
        .trim()

      if (fileName && fileContent && !fileName.includes("סוף_קובץ")) {
        files[fileName] = fileContent
      }
    }

    // Fallback pattern for standard code blocks
    if (Object.keys(files).length === 0) {
      const fallbackPattern =
        /(manifest\.json|popup\.html|popup\.js|styles\.css|content\.js|background\.js)[\s\S]*?```[\w]*\n?([\s\S]*?)```/g

      while ((match = fallbackPattern.exec(code)) !== null) {
        const fileName = match[1]
        let fileContent = match[2].trim()

        fileContent = fileContent
          .replace(/^```[\w]*\n?/gm, "")
          .replace(/\n?```$/gm, "")
          .trim()

        if (fileName && fileContent) {
          files[fileName] = fileContent
        }
      }
    }

    // If still no files found, create default structure
    if (Object.keys(files).length === 0) {
      files["manifest.json"] = `{
  "manifest_version": 3,
  "name": "Chrobo Extension",
  "version": "1.0",
  "description": "תוסף שנוצר על ידי Chrobo Ai",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["activeTab"]
}`

      files["popup.html"] = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Chrobo Extension</h1>
        <p>התוסף שלך מוכן לשימוש!</p>
    </div>
    <script src="popup.js"></script>
</body>
</html>`

      files["popup.js"] = `// תוסף Chrobo Ai
document.addEventListener('DOMContentLoaded', function() {
    console.log('התוסף נטען בהצלחה!');
});`

      files["styles.css"] = `body {
    width: 300px;
    padding: 20px;
    font-family: Arial, sans-serif;
    direction: rtl;
}

.container {
    text-align: center;
}

h1 {
    color: #4285f4;
    margin-bottom: 10px;
}`
    }

    return files
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
    this.currentFileTab = filename
    const content = this.currentFiles[filename] || ""

    this.codeContent.innerHTML = `<pre><code contenteditable="true">${this.escapeHtml(content)}</code></pre>`

    // Update active tab
    document.querySelectorAll(".file-tab").forEach((tab) => {
      tab.classList.remove("active")
      if (tab.textContent === filename) {
        tab.classList.add("active")
      }
    })

    // Update content when edited
    const editableCode = this.codeContent.querySelector("code")
    if (editableCode) {
      editableCode.addEventListener("input", () => {
        this.currentFiles[filename] = editableCode.textContent
      })
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  handleTextSelection(e) {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()

    if (selectedText.length > 0) {
      // Check if selection is within AI response or code editor
      const aiResponseArea = this.aiResponseSection.contains(selection.anchorNode)
      const codeEditorArea = this.codeEditorSection.contains(selection.anchorNode)

      if (aiResponseArea || codeEditorArea) {
        this.selectedText = selectedText
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        this.textSelectionPopup.style.display = "block"
        this.textSelectionPopup.style.left = rect.left + "px"
        this.textSelectionPopup.style.top = rect.bottom + window.scrollY + 5 + "px"
      } else {
        this.textSelectionPopup.style.display = "none"
      }
    } else {
      this.textSelectionPopup.style.display = "none"
    }
  }

  askAboutSelection() {
    this.selectedTextDisplay.textContent = this.selectedText
    this.selectedTextContext.style.display = "block"
    this.continueInput.placeholder = "מה תרצה לדעת על הטקסט שבחרת?"
    this.continueInput.focus()
    this.textSelectionPopup.style.display = "none"

    // Scroll to continue chat section
    this.continueChatSection.scrollIntoView({ behavior: "smooth" })
  }

  async continueChat() {
    const message = this.continueInput.value.trim()
    if (!message) {
      alert("אנא כתוב הודעה")
      return
    }

    if (!this.isApiKeyValid) {
      alert("אנא הגדר ושמור את מפתח ה-API תחילה")
      return
    }

    this.setContinueButtonLoading(true)

    try {
      let contextualMessage = message
      if (this.selectedText && this.selectedTextContext.style.display !== "none") {
        contextualMessage = `בהתבסס על הטקסט הבא: "${this.selectedText}"\n\n${message}`
        // Hide selected text context after use
        this.selectedTextContext.style.display = "none"
        this.selectedText = ""
      }

      const previousContext = this.aiResponseContent.textContent || ""
      const response = await this.callGeminiAPI(contextualMessage, true, previousContext)

      this.displayAIResponse(response)
      this.parseAndDisplayCode(response)

      if (this.settings.autoSaveChats) {
        this.saveCurrentChat(message, response)
      }

      this.continueInput.value = ""
      this.continueInput.placeholder =
        "מה תרצה לשנות או להוסיף לתוסף? למשל: 'הוסף כפתור לשינוי צבע', 'תקן את הבאג בפונקציה', 'הוסף אפשרות שמירה'..."
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("[v0] Error in continue chat:", error)
      alert("שגיאה בשליחת ההודעה: " + error.message)
    } finally {
      this.setContinueButtonLoading(false)
    }
  }

  saveCurrentChat(userMessage, aiResponse) {
    const chat = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 100) + (userMessage.length > 100 ? "..." : ""),
      aiResponse: aiResponse.substring(0, 200) + (aiResponse.length > 200 ? "..." : ""),
      isFavorite: false,
    }

    this.chatHistory.unshift(chat)
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(0, 50)
    }

    localStorage.setItem("chat_history", JSON.stringify(this.chatHistory))
  }

  loadChatHistory() {
    this.filterChats("all")
  }

  filterChats(type) {
    this.allChatsBtn.classList.toggle("active", type === "all")
    this.favoriteChatsBtn.classList.toggle("active", type === "favorites")

    const filteredChats = type === "favorites" ? this.chatHistory.filter((chat) => chat.isFavorite) : this.chatHistory

    if (filteredChats.length === 0) {
      this.chatsList.innerHTML = '<div class="empty-state">אין צ\'אטים שמורים עדיין</div>'
      return
    }

    this.chatsList.innerHTML = filteredChats
      .map(
        (chat) => `
        <div class="chat-item" data-id="${chat.id}">
          <div class="chat-header">
            <span class="chat-date">${new Date(chat.timestamp).toLocaleDateString("he-IL")}</span>
            <button class="favorite-btn ${chat.isFavorite ? "active" : ""}" data-id="${chat.id}">
              ${chat.isFavorite ? "★" : "☆"}
            </button>
          </div>
          <div class="chat-preview">
            <strong>שאלה:</strong> ${chat.userMessage}
          </div>
          <div class="chat-preview">
            <strong>תשובה:</strong> ${chat.aiResponse}
          </div>
        </div>
      `,
      )
      .join("")

    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleFavorite(Number.parseInt(btn.dataset.id))
      })
    })

    document.querySelectorAll(".chat-item").forEach((item) => {
      item.addEventListener("click", () => {
        this.loadChat(Number.parseInt(item.dataset.id))
      })
    })
  }

  toggleFavorite(chatId) {
    const chat = this.chatHistory.find((c) => c.id === chatId)
    if (chat) {
      chat.isFavorite = !chat.isFavorite
      localStorage.setItem("chat_history", JSON.stringify(this.chatHistory))
      this.loadChatHistory()
    }
  }

  loadChat(chatId) {
    const chat = this.chatHistory.find((c) => c.id === chatId)
    if (chat) {
      this.ideaInput.value = chat.userMessage
      this.closeModal("historyModal")
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

  createAndDownloadZip(files) {
    const JSZip = window.JSZip // Declare JSZip variable here
    if (typeof JSZip === "undefined") {
      alert("שגיאה: ספריית JSZip לא נטענה. אנא רענן את הדף ונסה שוב.")
      return
    }

    const zip = new JSZip()

    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content)
    })

    zip
      .generateAsync({ type: "blob" })
      .then((content) => {
        const url = URL.createObjectURL(content)
        const a = document.createElement("a")
        a.href = url
        a.download = "chrobo-extension.zip"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error("[v0] ZIP generation failed:", error)
        alert("שגיאה ביצירת קובץ ZIP. אנא נסה שוב.")
      })
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new ChroboAi()
})
