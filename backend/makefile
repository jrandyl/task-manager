postgres:
	docker run --name task-manager-pg -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=task-manager-123 -d postgres:16-alpine

createdb: 
	docker exec -it task-manager-pg createdb --username=root --owner=root task-manager

dropdb: 
	docker exec -it taskbee dropdb task-manager

sqlc:
	sqlc generate

server:
	go run main.go

.PHONY: postgres createdb dropdb sqlc server
