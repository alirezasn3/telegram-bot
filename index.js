const axios = require('axios')
const app = require('express')()
const EventEmitter = require('events')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')

class Bot extends EventEmitter {
  constructor(token, timeout = 30) {
    super()
    this.updates_queue = []
    this.api = `https://api.telegram.org/bot${token}`
    this.timeout = timeout
    this.offset
  }

  async getUpdates() {
    try {
      const { data } = await axios(`${this.api}/getUpdates?timeout=${this.timeout}${this.offset ? `&offset=${this.offset}` : ''}`)
      const { result, ok } = data

      if (ok === true && result.length > 0) {
        this.updates_queue = result
        this.offset = result[result.length - 1].update_id + 1
        this.millies = new Date().getTime()
      } else {
        console.log('no update')
      }
    } catch (err) {
      console.log(err.message)
    }
  }

  async respondToUpdates() {
    try {
      this.updates_queue.forEach(async (u) => {
        const update = {}
        if (u.callback_query) {
          update.type = 'callback_query'
          update.message_id = u.callback_query.message.message_id
          update.chat_id = u.callback_query.message.chat.id
          update.data = u.callback_query.data
          update.callback_query_id = u.callback_query.id
          update.message = u.callback_query.message.text
          update.entities = u.callback_query.message.entities
          super.emit('callback_query', update)
        } else {
          update.date = u.message.date
          update.message_id = u.message.message_id
          update.chat_id = u.message.chat.id
          if (u.message.text[0] === '/') {
            update.type = 'command'
            update.command = u.message.text
            super.emit('command', update)
          } else {
            update.type = 'message'
            update.text = u.message.text
            super.emit('message', update)
          }
        }
      })
      this.updates_queue = []
    } catch (err) {
      console.log('Line 130: ' + err.message)
    }
  }

  async startPolling() {
    try {
      const { data } = await axios(`${this.api}/getWebhookInfo`)
      if (data.result.url === '') {
        while (true) {
          await this.getUpdates()
          await this.respondToUpdates()
        }
      } else {
        await this.deletWebhook()
        await this.startPolling()
      }
    } catch (err) {
      console.log('147' + err.message)
    }
  }

  async setWebhook(url) {
    try {
      const { data } = await axios.post(`${this.api}/setWebhook`, {
        url,
      })
      console.log(data.description)
    } catch (err) {
      console.log('158' + err.message)
    }
  }

  async deletWebhook() {
    try {
      const { data } = await axios.post(`${this.api}/deleteWebhook`)
      console.log(data.description)
    } catch (err) {
      console.log('167' + err.message)
    }
  }

  async startWebhook() {
    try {
      const { data } = await axios(`${this.api}/getWebhookInfo`)
      if (data.result.url === '') {
        console.log('Webhook url not set. Use setWebhook() method')
      } else {
        app.post('/', (req, res) => {
          const update = {}
          if (req.body.callback_query) {
            update.type = 'callback_query'
            update.message_id = req.body.callback_query.message.message_id
            update.chat_id = req.body.callback_query.message.chat.id
            update.data = req.body.callback_query.data
            update.callback_query_id = u.callback_query.id
            update.message = u.callback_query.message.text
            update.entities = u.callback_query.message.entities
            super.emit('callback_query', update)
          } else {
            update.message_id = req.body.message.message_id
            update.chat_id = req.body.message.chat.id
            if (req.body.message.text[0] === '/') {
              update.type = 'command'
              update.command = req.body.message.text
              super.emit('command', update)
            } else {
              update.type = 'message'
              update.text = req.body.message.text
              super.emit('message', update)
            }
          }
          res.sendStatus(200)
        })
        app.listen(3000)
      }
    } catch (err) {
      console.log('206' + err.message)
    }
  }

  async setTypingStatus(chat_id) {
    try {
      axios.post(`${this.api}/sendChatAction?action=typing&chat_id=${chat_id}`)
    } catch (err) {
      console.log('214' + err.message)
    }
  }

  async sendMessage(params) {
    try {
      const { data } = await axios.post(`${this.api}/sendMessage`, params)
      return data.result.message_id
    } catch (err) {
      console.log('223' + err.message)
    }
  }

  async editMessage(params) {
    try {
      await axios.post(`${this.api}/editMessageText`, params)
    } catch (err) {
      console.log('231' + err.message)
    }
  }

  async deleteMessage(params) {
    try {
      await axios.post(`${this.api}/deleteMessage`, params)
    } catch (err) {
      console.log(err.message)
    }
  }

  async answerCallbackQuery(params) {
    try {
      await axios.post(`${this.api}/answerCallbackQuery`, params)
    } catch (err) {
      console.log('247' + err.message)
    }
  }
}
