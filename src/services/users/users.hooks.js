import _ from 'lodash'
import { serialize, updateAbilities, populatePreviousObject, enforcePasswordPolicy, storePreviousPassword } from '../../hooks'
const { hashPassword } = require('@feathersjs/authentication-local').hooks
const commonHooks = require('feathers-hooks-common')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      commonHooks.when(hook => _.get(hook.app.get('authentication'), 'disallowRegistration'),
        commonHooks.disallow('external')),
      commonHooks.when(hook => hook.data.googleId, serialize([
        { source: 'google.profile.displayName', target: 'name' },
        { source: 'google.profile.emails[0].value', target: 'email' }
      ], { throwOnNotFound: true })),
      commonHooks.when(hook => hook.data.githubId, serialize([
        { source: 'github.profile.displayName', target: 'name' },
        { source: 'github.profile.emails[0].value', target: 'email' }
      ], { throwOnNotFound: true })),
      serialize([
        { source: 'name', target: 'profile.name', delete: true },
        { source: 'email', target: 'profile.description' }
      ], { throwOnNotFound: true }),
      serialize([
        // Enforcing password policy requires both the clear and hashed password,
        // Keep track of clear password here since hashPassword() remove it
        // FIXME: for testing purpose we create users without a password for now
        // should it be fixed for safety ?
        { source: 'password', target: 'clearPassword' }
      ], { throwOnNotFound: false }),
      hashPassword(),
      enforcePasswordPolicy({ userAsItem: true }),
      // Now we have enforced password policy remove the clear password
      // (we only store hashed password for safety)
      commonHooks.discard('clearPassword')
    ],
    // when changing password store previous one for password policy
    update: [ commonHooks.when(hook => hook.data.password && hook.app.getPasswordPolicy, populatePreviousObject, storePreviousPassword({ userAsItem: true })) ],
    patch: [ commonHooks.when(hook => hook.data.password && hook.app.getPasswordPolicy, populatePreviousObject, storePreviousPassword({ userAsItem: true })) ],
    remove: []
  },

  after: {
    all: [
      commonHooks.when(hook => hook.params.provider, commonHooks.discard('password'), commonHooks.discard('previousPasswords')),
      serialize([
        {source: 'profile.name', target: 'name'},
        {source: 'profile.avatar', target: 'avatar'},
        {source: 'profile.description', target: 'description'}
      ])
    ],
    find: [],
    get: [],
    create: [ updateAbilities() ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
