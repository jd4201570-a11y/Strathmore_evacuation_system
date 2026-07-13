const express = require('express')
const { body, query } = require('express-validator')
const { handleValidation, validateEmail, validatePassword } = require('../middleware/validate')
const { agent, createTestApp } = require('./helpers/httpTest')

describe('validation middleware', () => {
  let app
  let testAgent

  beforeEach(() => {
    app = createTestApp()
    app.post('/test/register', validateEmail, validatePassword, handleValidation, (req, res) => {
      res.json({ ok: true })
    })
    app.get('/test/search', query('q').isString().notEmpty(), handleValidation, (req, res) => {
      res.json({ ok: true })
    })
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('rejects invalid email with 400', async () => {
    const res = await testAgent.post('/test/register', {
      email: 'not-an-email',
      password: 'secret123',
    })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  test('rejects short password with 400', async () => {
    const res = await testAgent.post('/test/register', {
      email: 'user@strathmore.edu',
      password: '123',
    })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })

  test('accepts valid email and password', async () => {
    const res = await testAgent.post('/test/register', {
      email: 'user@strathmore.edu',
      password: 'Test@1234',
    })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('rejects empty search query', async () => {
    const res = await testAgent.get('/test/search?q=')

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})
