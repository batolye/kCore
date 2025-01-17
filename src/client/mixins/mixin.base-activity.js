import _ from 'lodash'
import { uid, Events } from 'quasar'

let baseActivityMixin = {
  data () {
    return {
      title: '',
      actions: {},
      searchQuery: {}
    }
  },
  watch: {
    '$route' (to, from) {
      // React to route changes but reusing the same component as this one is generic
      // However we don't have to for child routes (forward and back) as the parent remains the same
      if (!to.path.startsWith(from.path) && !from.path.startsWith(to.path)) {
        this.refreshActivity()
      }
    }
  },
  methods: {
    registerTabAction (action) {
      this.registerAction('tabBar', action)
      this.$store.patch('tabBar', { tabs: this.getActions('tabBar') })
    },
    unregisterTabAction (nameOrId) {
      this.unregisterAction('tabBar', nameOrId)
      this.$store.patch('tabBar', { tabs: this.getActions('tabBar') })
    },
    registerFabAction (action) {
      this.registerAction('fab', action)
      this.$store.patch('fab', { actions: this.getActions('fab') })
    },
    unregisterFabAction (nameOrId) {
      this.unregisterAction('fab', nameOrId)
      this.$store.patch('fab', { actions: this.getActions('fab') })
    },
    registerAction (type, action) {
      action.id = _.kebabCase(action.name)
      action.uid = uid()
      if (!this.actions[type]) this.actions[type] = []
      this.actions[type].push(action)
    },
    unregisterAction (type, nameOrId) {
      // Ensure we convert to the right case when using name
      const id = _.kebabCase(nameOrId)
      if (!this.actions[type]) return
      _.remove(this.actions[type], (action) => (action.id === id) || (action.uid === id))
    },
    getActions (type) {
      return this.actions[type] || []
    },
    getAction (nameOrId, type) {
      // Ensure we convert to the right case when using name
      const id = _.kebabCase(nameOrId)
      const actions = this.getActions(type)
      return _.find(actions, (action) => (action.id === id) || (action.uid === id))
    },
    clearActions () {
      // Clear tabBar actions
      this.$store.patch('tabBar', { tabs: [] })
      // Clear Fab actions
      this.$store.patch('fab', { actions: [] })
      // Clear the actions
      this.actions = {}
    },
    setTitle (title) {
      this.$store.patch('appBar', { title: title })
    },
    clearTitle () {
      this.$store.patch('appBar', { title: '' })
    },
    setSearchBar (field, services = []) {
      // Patch only activity-specific fields, pattern/items are updated by the search bar
      for (let i = 0; i < services.length; i++) services[i].limit = 1
      this.$store.patch('searchBar', { field: field, services: services })
    },
    clearSearchBar () {
      // Patch all fields to reset search
      this.$store.patch('searchBar', { field: '', pattern: '', services: [], items: [] })
    },
    setRightPanelContent (component, content) {
      this.$store.patch('rightPanel', { component: component, content: content })
    },
    clearRightPanelContent () {
      this.$store.patch('rightPanel', { component: '', content: {} })
    },
    clearActivity () {
      this.clearTitle()
      this.clearSearchBar()
      this.clearActions()
      this.clearRightPanelContent()
    },
    refreshActivity () {
      // This method should be overriden in activities
      this.clearActivity()
    },
    handleSearch () {
      // Update search query based on activity search config + currently selected pattern/items
      const search = this.$store.get('searchBar')
      let query = {}
      // Handle the pattern
      if (search.pattern !== '') {
        query[search.field] = { $search: search.pattern }
      }
      // Handle the selection
      search.items.forEach(item => {
        // We must have only one item per service
        let queryPath = item.service + '.' + item.field
        query[queryPath] = item[item.field]
      })
      this.searchQuery = Object.assign({}, query)
    }
  },
  created () {
    // Register the actions
    this.refreshActivity()
    // Whenever the user abilities are updated, update activity as well
    Events.$on('user-abilities-changed', this.refreshActivity)
    Events.$on('search-bar-changed', this.handleSearch)
  },
  beforeDestroy () {
    Events.$off('user-abilities-changed', this.refreshActivity)
    Events.$off('search-bar-changed', this.handleSearch)
  }
}

export default baseActivityMixin
