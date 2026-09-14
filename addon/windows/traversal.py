"""Inventory visit plan, not copy identity. UI code must verify each viewport before reading it."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Page:
    first_row: int
    visible_indices: tuple
    unread_indices: tuple


def page_plan(total,columns,rows):
    if any(type(v) is not int for v in [total,columns,rows]):
        raise ValueError('Les dimensions et le total doivent être connus')
    if not 0<=total<=20000 or not 1<=columns<=12 or not 1<=rows<=12:
        raise ValueError('Dimensions ou total invalides')
    last_first_row=max(0,(total+columns-1)//columns-rows)
    visited=0
    while visited<total:
        first_row=min(visited//columns,last_first_row)
        start=first_row*columns
        end=min(total,start+columns*rows)
        if end<=visited:
            raise ValueError('La pagination ne progresse pas')
        yield Page(first_row,tuple(range(start,end)),tuple(range(visited,end)))
        visited=end


class Coverage:
    """An interrupted or changed inventory never becomes a complete snapshot."""
    def __init__(self,total,columns,rows):
        self.pages=list(page_plan(total,columns,rows))
        self.total=total
        self.next_page=0
        self.observations={}

    def accept(self,page,first_row,reported_total,observations):
        if self.next_page>=len(self.pages) or page!=self.pages[self.next_page]:
            raise ValueError('Page absente, répétée ou dans le mauvais ordre')
        if first_row!=page.first_row or reported_total!=self.total:
            raise ValueError('La grille ou le total a changé pendant la lecture')
        if set(observations)!=set(page.unread_indices) or any(v is None for v in observations.values()):
            raise ValueError('La page contient des cases non lues')
        self.observations.update(observations)
        self.next_page+=1

    def finish(self,final_total):
        if final_total!=self.total or self.next_page!=len(self.pages) or len(self.observations)!=self.total:
            raise ValueError('Inventaire incomplet ; ne pas remplacer les données existantes')
        return [self.observations[i] for i in range(self.total)]
