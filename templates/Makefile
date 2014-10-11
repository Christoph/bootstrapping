CC=gcc
CFLAGS=-Wall -g -c
SOURCES=test.c 
OBJECTS=$(SOURCES:.c=.o)
EXE=start

all: $(SOURCES) $(EXE)

$(EXE): $(OBJECTS) 
	$(CC) $(OBJECTS) -o $@ 

.c.o: 
	$(CC) $(CFLAGS) $< -o $@ 

clean:
	rm -f $(EXE)
	rm -f $(OBJECTS)
