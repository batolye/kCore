import { Events } from 'quasar'
import { getLocale } from '../utils'

let baseCollectionMixin = {
  props: {
    // This value can be overriden in activities if they want to manage pagination by themselves
    // nbItemsPerPage = 0 means that the client does not handle pagination and server defaults will be used
    nbItemsPerPage: {
      type: Number,
      default: 12
    }
  },
  computed: {
    nbPages () {
      return (this.nbItemsPerPage > 0 ? Math.ceil(this.nbTotalItems / this.nbItemsPerPage) : 1)
    }
  },
  data () {
    return {
      items: [],
      nbTotalItems: 0,
      currentPage: 1
    }
  },
  methods: {
    subscribe (query) {
      // Remove previous listener if any
      this.unsubscribe()
      this.itemListener = this.loadService().watch({ listStrategy: this.listStrategy || 'always' })
      .find({ query })
      .subscribe(response => {
        this.items = response.data
        this.nbTotalItems = response.total
        this.$emit('collection-refreshed')
      }, error => {
        Events.$emit('error', error)
      })
    },
    unsubscribe () {
      if (this.itemListener) {
        this.itemListener.unsubscribe()
        this.itemListener = null
      }
    },
    getCollectionBaseQuery () {
      // This method should be overriden in activities
      return {}
    },
    getCollectionFilterQuery () {
      // This method should be overriden in activities
      return {}
    },
    getCollectionPaginationQuery () {
      // This method can be overriden in activities
      if (this.nbItemsPerPage > 0) return {
        $limit: this.nbItemsPerPage,
        $skip: (this.currentPage - 1) * this.nbItemsPerPage
      }
      else return {}
    },
    refreshCollection () {
      // Add locale to perform sorting (i.e. collation) correctly w.r.t. user's language
      let fullQuery = Object.assign({ $locale: getLocale() },
        this.getCollectionBaseQuery(),
        this.getCollectionFilterQuery(),
        this.getCollectionPaginationQuery())
      // Find the desired items
      this.subscribe(fullQuery)
    },
    onPageChanged () {
      this.refreshCollection()
    },
    onItemSelected (item) {
      // FIXME: support multi-selection
      this.$emit('selection-changed', item)
    }
  },
  beforeDestroy () {
    this.unsubscribe()
  }
}

export default baseCollectionMixin
