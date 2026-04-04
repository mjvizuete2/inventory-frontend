import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProductCategory } from '../../../../shared/interfaces/product-category';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { CategoryDeleteDialogComponent } from '../category-delete-dialog/category-delete-dialog.component';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule
  ],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit, AfterViewInit {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<ProductCategory>([]);

  loading = true;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (category, filter) => {
      const normalizedFilter = filter.trim().toLowerCase();
      return `${category.name} ${category.description ?? ''} ${category.active !== false ? 'activa' : 'inactiva'}`
        .toLowerCase()
        .includes(normalizedFilter);
    };

    this.dataSource.sortingDataAccessor = (category, property) => {
      switch (property) {
        case 'active':
          return category.active === false ? 0 : 1;
        default:
          return `${category[property as keyof ProductCategory] ?? ''}`.toLowerCase();
      }
    };
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.attachTableHelpers();
  }

  get activeCategoriesCount(): number {
    return this.dataSource.data.filter((category) => category.active !== false).length;
  }

  get categoriesWithDescriptionCount(): number {
    return this.dataSource.data.filter((category) => (category.description ?? '').trim().length > 0).length;
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = ((event.target as HTMLInputElement).value ?? '').trim().toLowerCase();
    this.paginator?.firstPage();
  }

  openCreateDialog(): void {
    this.dialog.open(CategoryFormDialogComponent, {
      width: '560px',
      data: { mode: 'create' }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: { name: string; description?: string; active: boolean }) => {
        if (!result) {
          return;
        }

        this.categoryService.createCategory(result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.openSnackBar('Categoria creada correctamente.');
              this.loadCategories();
            },
            error: (error) => this.openSnackBar(error.error?.message ?? 'No se pudo crear la categoria.')
          });
      });
  }

  openEditDialog(category: ProductCategory): void {
    this.dialog.open(CategoryFormDialogComponent, {
      width: '560px',
      data: { mode: 'edit', category }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: { name: string; description?: string; active: boolean }) => {
        if (!result) {
          return;
        }

        this.categoryService.updateCategory(category.id, result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.openSnackBar('Categoria actualizada correctamente.');
              this.loadCategories();
            },
            error: (error) => this.openSnackBar(error.error?.message ?? 'No se pudo actualizar la categoria.')
          });
      });
  }

  openDeleteDialog(category: ProductCategory): void {
    this.dialog.open(CategoryDeleteDialogComponent, {
      width: '420px',
      data: category
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.categoryService.deleteCategory(category.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.openSnackBar('Categoria eliminada correctamente.');
              this.loadCategories();
            },
            error: (error) => this.openSnackBar(error.error?.message ?? 'No se pudo eliminar la categoria.')
          });
      });
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.dataSource.data = categories;
          this.productService.setCategories(categories);
          this.loading = false;
          this.attachTableHelpers();
        },
        error: () => {
          this.loading = false;
          this.openSnackBar('No se pudieron cargar las categorias.');
        }
      });
  }

  private attachTableHelpers(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private openSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
