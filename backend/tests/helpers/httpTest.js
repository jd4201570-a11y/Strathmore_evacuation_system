const http = require('http')

class TestAgent {
  constructor(app) {
    this.app = app
    this.server = null
  }

  async listen() {
    if (!this.server) {
      this.server = await new Promise((resolve) => {
        const server = this.app.listen(0, () => resolve(server))
      })
    }
    return this.server
  }

  async close() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve))
      this.server = null
    }
  }

  get(url) {
    return this._send('GET', url)
  }

  post(url, body) {
    return this._send('POST', url, body)
  }

  async _send(method, url, body) {
    const server = await this.listen()
    const { port } = server.address()
    const headers = body ? { 'Content-Type': 'application/json' } : {}

    return new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: '127.0.0.1', port, path: url, method, headers },
        (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            let parsed = data
            try {
              parsed = data ? JSON.parse(data) : {}
            } catch (_) {
              parsed = data
            }
            resolve({ status: res.statusCode, body: parsed, text: data })
          })
        }
      )
      req.on('error', reject)
      if (body) req.write(JSON.stringify(body))
      req.end()
    })
  }
}

function createTestApp() {
  const express = require('express')
  const app = express()
  app.use(express.json())
  return app
}

function agent(app) {
  return new TestAgent(app)
}

module.exports = { agent, createTestApp }
