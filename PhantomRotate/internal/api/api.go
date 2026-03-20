package api

import (
	"PhantomRotate/internal/clash"
	"PhantomRotate/internal/proxy"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	proxyMgr *proxy.Manager
	clashMgr *clash.Manager
}

func NewHandler(proxyMgr *proxy.Manager, clashMgr *clash.Manager) *Handler {
	return &Handler{
		proxyMgr: proxyMgr,
		clashMgr: clashMgr,
	}
}

func SetupRouter(proxyMgr *proxy.Manager, clashMgr *clash.Manager) *gin.Engine {
	h := NewHandler(proxyMgr, clashMgr)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	cors := func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
	r.Use(cors)

	r.GET("/api/health", h.HealthCheck)

	r.GET("/api/nodes", h.GetNodes)
	r.GET("/api/nodes/:id", h.GetNode)
	r.POST("/api/nodes", h.AddNode)
	r.DELETE("/api/nodes/:id", h.DeleteNode)
	r.POST("/api/nodes/load", h.LoadNodes)
	r.POST("/api/nodes/subscription", h.LoadSubscription)

	r.GET("/api/pool", h.GetPool)
	r.POST("/api/pool/healthcheck", h.TriggerHealthCheck)

	r.GET("/api/clash/proxies", h.GetClashProxies)
	r.PUT("/api/clash/proxies/:group/:name", h.SelectProxy)
	r.GET("/api/clash/config", h.GetClashConfig)
	r.PUT("/api/clash/config", h.UpdateClashConfig)
	r.POST("/api/clash/reload", h.ReloadClash)

	return r
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) GetNodes(c *gin.Context) {
	nodes := h.proxyMgr.GetNodes()
	c.JSON(http.StatusOK, gin.H{"nodes": nodes})
}

func (h *Handler) GetNode(c *gin.Context) {
	id := c.Param("id")
	nodes := h.proxyMgr.GetNodes()
	for _, n := range nodes {
		if n.ID == id {
			c.JSON(http.StatusOK, n)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "node not found"})
}

func (h *Handler) AddNode(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.proxyMgr.AddNode(req.URL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "node added"})
}

func (h *Handler) DeleteNode(c *gin.Context) {
	id := c.Param("id")
	if err := h.proxyMgr.RemoveNode(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "node deleted"})
}

func (h *Handler) LoadNodes(c *gin.Context) {
	var req struct {
		Path string `json:"path" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.proxyMgr.LoadNodesFromFile(req.Path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "nodes loaded"})
}

func (h *Handler) LoadSubscription(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.proxyMgr.LoadNodesFromSubscription(req.URL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "subscription loaded"})
}

func (h *Handler) GetPool(c *gin.Context) {
	pool := h.proxyMgr.GetPool()
	c.JSON(http.StatusOK, pool)
}

func (h *Handler) TriggerHealthCheck(c *gin.Context) {
	h.proxyMgr.HealthCheck()
	c.JSON(http.StatusOK, gin.H{"message": "health check triggered"})
}

func (h *Handler) GetClashProxies(c *gin.Context) {
	proxies, err := h.clashMgr.GetProxies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"proxies": proxies})
}

func (h *Handler) SelectProxy(c *gin.Context) {
	group := c.Param("group")
	name := c.Param("name")

	if err := h.clashMgr.SelectProxy(group, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "proxy selected"})
}

func (h *Handler) GetClashConfig(c *gin.Context) {
	cfg, err := h.clashMgr.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func (h *Handler) UpdateClashConfig(c *gin.Context) {
	var cfg clash.ClashConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.clashMgr.UpdateConfig(&cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "config updated"})
}

func (h *Handler) ReloadClash(c *gin.Context) {
	if err := h.clashMgr.Restart(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "clash restarted"})
}
