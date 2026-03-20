package main

import (
	"log"

	"PhantomRotate/internal/api"
	"PhantomRotate/internal/clash"
	"PhantomRotate/internal/config"
	"PhantomRotate/internal/proxy"
)

func main() {
	cfg := config.Load()

	clashManager := clash.NewManager(cfg.ClashBin, cfg.ConfigDir)
	if err := clashManager.Start(); err != nil {
		log.Fatalf("Failed to start Clash: %v", err)
	}
	defer clashManager.Stop()

	proxyMgr := proxy.NewManager(clashManager, cfg)

	router := api.SetupRouter(proxyMgr, clashManager)

	addr := cfg.ServerAddr
	log.Printf("PhantomRotate starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
